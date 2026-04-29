import { z } from "zod";
import { buildSystemPrompt } from "./prompts";
import { validateCitation } from "./citation-validator";
import type { Corpus } from "./corpus-types";
import type { ClaudeClient } from "./claude";

const SUPPORTED_MODELS = ["claude-sonnet-4-6", "claude-opus-4-7"] as const;
type SupportedModel = (typeof SUPPORTED_MODELS)[number];

const askRequestSchema = z.object({
  question: z.string().trim().min(1),
  model: z.enum(SUPPORTED_MODELS).optional(),
});

export interface AskHandlerDeps {
  corpus: Corpus;
  claudeClient: ClaudeClient;
  defaultModel: SupportedModel;
}

export type AskHandler = (req: Request) => Promise<Response>;

export function createAskHandler(deps: AskHandlerDeps): AskHandler {
  return async (req) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "invalid_request", message: "body must be valid JSON" },
        { status: 400 }
      );
    }

    const parsed = askRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "invalid_request", message: parsed.error.message },
        { status: 400 }
      );
    }

    const model = parsed.data.model ?? deps.defaultModel;
    const systemPrompt = buildSystemPrompt(deps.corpus);

    let llm;
    try {
      llm = await deps.claudeClient.ask({
        systemPrompt,
        question: parsed.data.question,
        model,
      });
    } catch (e) {
      return Response.json(
        { error: "llm_error", message: (e as Error).message },
        { status: 502 }
      );
    }

    const validations = llm.answer.citations.map((c) => ({
      citation: c,
      result: validateCitation(deps.corpus, c),
    }));

    const failures = validations.filter((v) => !v.result.verified);
    if (failures.length > 0) {
      return Response.json(
        {
          error: "citation_verification_failed",
          details: failures.map((f) => ({
            article_id: f.citation.article_id,
            quote: f.citation.quote,
            source: f.citation.source,
            reason: f.result.verified ? "unknown" : f.result.reason,
          })),
          trace: llm.trace,
        },
        { status: 422 }
      );
    }

    return Response.json({
      answer: llm.answer.answer,
      citations: llm.answer.citations.map((c) => ({ ...c, verified: true })),
      trace: llm.trace,
    });
  };
}
