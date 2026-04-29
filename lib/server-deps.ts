import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { loadCorpus } from "./corpus";
import { createClaudeClient, type ClaudeClient } from "./claude";
import type { Corpus } from "./corpus-types";

let corpusPromise: Promise<Corpus> | null = null;
let claudeClient: ClaudeClient | null = null;

export function getCorpusPath(): string {
  return process.env.CORPUS_PATH ?? path.resolve(process.cwd(), "data/concrete-design-code.json");
}

export function getCorpus(): Promise<Corpus> {
  if (!corpusPromise) {
    corpusPromise = loadCorpus(getCorpusPath());
  }
  return corpusPromise;
}

export function getClaudeClient(): ClaudeClient {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    const sdk = new Anthropic({ apiKey });
    claudeClient = createClaudeClient({ sdk });
  }
  return claudeClient;
}

export function getDefaultModel(): "claude-sonnet-4-6" | "claude-opus-4-7" {
  const fromEnv = process.env.DEFAULT_MODEL;
  if (fromEnv === "claude-opus-4-7") return "claude-opus-4-7";
  return "claude-sonnet-4-6";
}
