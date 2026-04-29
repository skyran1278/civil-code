import { describe, it, expect, vi } from "vitest";
import { createClaudeClient, type MessagesApi } from "@/lib/claude";

function makeMockSdk(response: unknown): {
  sdk: { messages: MessagesApi };
  create: ReturnType<typeof vi.fn>;
} {
  const create = vi.fn().mockResolvedValue(response);
  return { sdk: { messages: { create } }, create };
}

const validLlmAnswer = {
  answer: "箍筋之間距不得超過 d/4",
  citations: [
    { article_id: "15.5.4", quote: "箍筋之間距不得超過 d/4", source: "body" as const },
  ],
};

function toolUseBlock(input: unknown) {
  return { type: "tool_use", name: "answer_with_citations", input };
}

describe("createClaudeClient", () => {
  it("calls SDK with the requested model", async () => {
    const { sdk, create } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({ model: "claude-sonnet-4-6" });
  });

  it("sends system prompt with cache_control for prompt caching", async () => {
    const { sdk, create } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" });
    const call = create.mock.calls[0][0];
    expect(Array.isArray(call.system)).toBe(true);
    expect(call.system[0]).toMatchObject({
      type: "text",
      text: "S",
      cache_control: { type: "ephemeral" },
    });
  });

  it("sends the user question as a user message", async () => {
    const { sdk, create } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await client.ask({ systemPrompt: "S", question: "What is X?", model: "claude-sonnet-4-6" });
    const call = create.mock.calls[0][0];
    expect(call.messages).toEqual([{ role: "user", content: "What is X?" }]);
  });

  it("forces tool_choice on the answer_with_citations tool", async () => {
    const { sdk, create } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" });
    const call = create.mock.calls[0][0];
    expect(call.tools).toHaveLength(1);
    expect(call.tools[0]).toMatchObject({
      name: "answer_with_citations",
      input_schema: { type: "object" },
    });
    expect(call.tool_choice).toEqual({ type: "tool", name: "answer_with_citations" });
  });

  it("returns parsed answer and trace with cache_hit=false on first call", async () => {
    const { sdk } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 0, cache_creation_input_tokens: 80 },
    });
    const client = createClaudeClient({ sdk });
    const result = await client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" });
    expect(result.answer.answer).toBe("箍筋之間距不得超過 d/4");
    expect(result.answer.citations).toHaveLength(1);
    expect(result.trace.cache_hit).toBe(false);
    expect(result.trace.model).toBe("claude-sonnet-4-6");
    expect(result.trace.input_tokens).toBe(100);
    expect(result.trace.output_tokens).toBe(20);
    expect(typeof result.trace.latency_ms).toBe("number");
  });

  it("reports cache_hit=true when cache_read_input_tokens > 0", async () => {
    const { sdk } = makeMockSdk({
      content: [toolUseBlock(validLlmAnswer)],
      usage: { input_tokens: 5, output_tokens: 20, cache_read_input_tokens: 95, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    const result = await client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" });
    expect(result.trace.cache_hit).toBe(true);
  });

  it("throws when SDK response has no tool_use block", async () => {
    const { sdk } = makeMockSdk({
      content: [{ type: "text", text: "I refuse to use the tool" }],
      usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await expect(
      client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" })
    ).rejects.toThrow(/tool_use/);
  });

  it("throws when tool_use input does not match schema", async () => {
    const { sdk } = makeMockSdk({
      content: [toolUseBlock({ answer: "x" })], // missing citations
      usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const client = createClaudeClient({ sdk });
    await expect(
      client.ask({ systemPrompt: "S", question: "Q", model: "claude-sonnet-4-6" })
    ).rejects.toThrow();
  });
});
