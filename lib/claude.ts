import { llmAnswerSchema, type LlmAnswer } from "./schemas";

export interface MessagesApi {
  // Loose interface so both the mock and the real Anthropic SDK satisfy it.
  // The real SDK returns Message which is a superset of what we read here.
  create: (params: {
    model: string;
    max_tokens: number;
    system: Array<{ type: "text"; text: string; cache_control?: { type: "ephemeral" } }>;
    messages: Array<{ role: "user"; content: string }>;
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
  text?: string;
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
      });
      const response = raw as ClaudeMessageResponse;
      const latency_ms = Date.now() - start;

      const textBlock = response.content.find((c) => c.type === "text");
      if (!textBlock?.text) {
        throw new Error("Claude response missing text content");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(textBlock.text);
      } catch (e) {
        throw new Error(`Claude response is not valid JSON: ${(e as Error).message}`);
      }

      const answer = llmAnswerSchema.parse(parsed);

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
