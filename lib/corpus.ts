import { readFile } from "node:fs/promises";
import { corpusSchema } from "./schemas";
import type { Article, Corpus } from "./corpus-types";

export async function loadCorpus(filePath: string): Promise<Corpus> {
  const raw = await readFile(filePath, "utf-8");
  const json = JSON.parse(raw);
  return corpusSchema.parse(json);
}

export function getArticleById(corpus: Corpus, id: string): Article | null {
  return corpus.articles.find((a) => a.id === id) ?? null;
}
