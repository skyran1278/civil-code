import { z } from "zod";
import { llmAnswerSchema, type LlmAnswer } from "./schemas";

const ANSWER_TOOL_NAME = "answer_with_citations";
const ANSWER_TOOL_DESCRIPTION =
  "Return the final answer along with verbatim citations from the regulation corpus.";

interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: { type: "object"; [k: string]: unknown };
}

interface AnthropicToolChoice {
  type: "tool";
  name: string;
}

export interface MessagesApi {
  // Loose interface so both the mock and the real Anthropic SDK satisfy it.
  // The real SDK returns Message which is a superset of what we read here.
  create: (params: {
    model: string;
    max_tokens: number;
    system: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
    messages: Array<{ role: "user"; content: string }>;
    tools: AnthropicTool[];
    tool_choice: AnthropicToolChoice;
  }) => Promise<unknown>;
}

interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

interface ClaudeContentBlock {
  type: string;
  name?: string;
  input?: unknown;
}

interface ClaudeMessageResponse {
  content: ClaudeContentBlock[];
  usage: ClaudeUsage;
}

export interface AskParams {
  systemPrompt: string;
  question: string;
  model: string;
}

export interface AskTrace {
  model: string;
  cache_hit: boolean;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  latency_ms: number;
}

export interface AskResult {
  answer: LlmAnswer;
  trace: AskTrace;
}

export interface ClaudeClient {
  ask(params: AskParams): Promise<AskResult>;
}

export function createClaudeClient(deps: {
  sdk: { messages: MessagesApi };
  maxTokens?: number;
}): ClaudeClient {
  const maxTokens = deps.maxTokens ?? 2048;
  const inputSchema = z.toJSONSchema(llmAnswerSchema) as AnthropicTool["input_schema"];
  const answerTool: AnthropicTool = {
    name: ANSWER_TOOL_NAME,
    description: ANSWER_TOOL_DESCRIPTION,
    input_schema: inputSchema,
  };

  return {
    async ask({ systemPrompt, question, model }) {
      const start = Date.now();
      const raw = await deps.sdk.messages.create({
        model,
        max_tokens: maxTokens,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: question }],
        tools: [answerTool],
        tool_choice: { type: "tool", name: ANSWER_TOOL_NAME },
      });
      const response = raw as ClaudeMessageResponse;
      const latency_ms = Date.now() - start;

      const toolUse = response.content.find(
        (c) => c.type === "tool_use" && c.name === ANSWER_TOOL_NAME
      );
      if (!toolUse || toolUse.input === undefined) {
        throw new Error(
          `Claude response missing tool_use block for ${ANSWER_TOOL_NAME}`
        );
      }

      const answer = llmAnswerSchema.parse(toolUse.input);

      const cache_read = response.usage.cache_read_input_tokens ?? 0;
      const cache_create = response.usage.cache_creation_input_tokens ?? 0;

      return {
        answer,
        trace: {
          model,
          cache_hit: cache_read > 0,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_read_input_tokens: cache_read,
          cache_creation_input_tokens: cache_create,
          latency_ms,
        },
      };
    },
  };
}
