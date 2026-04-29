import { z } from "zod";

export const citationSchema = z
  .object({
    article_id: z.string().min(1),
    quote: z.string().min(1),
    source: z.enum(["body", "commentary"]),
  })
  .strict();

export const llmAnswerSchema = z
  .object({
    answer: z.string().min(1),
    citations: z.array(citationSchema),
  })
  .strict();

export const articleSchema = z.object({
  id: z.string().min(1),
  chapter: z.string(),
  section: z.string(),
  subsection: z.string(),
  body: z.string(),
  commentary: z.string().nullable(),
  tables: z.array(z.unknown()),
  reviewed: z.boolean(),
});

export const corpusMetaSchema = z.object({
  law_id: z.string(),
  law_name: z.string(),
  version: z.string(),
  source_url: z.string(),
  ingested_at: z.string(),
  model_used_for_ingest: z.string(),
});

export const corpusSchema = z.object({
  meta: corpusMetaSchema,
  articles: z.array(articleSchema),
});

export type LlmAnswer = z.infer<typeof llmAnswerSchema>;
export type CitationInput = z.infer<typeof citationSchema>;
