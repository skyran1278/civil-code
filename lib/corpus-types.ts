export interface Article {
  id: string;
  chapter: string;
  section: string;
  subsection: string;
  body: string;
  commentary: string | null;
  tables: unknown[];
  reviewed: boolean;
}

export interface CorpusMeta {
  law_id: string;
  law_name: string;
  version: string;
  source_url: string;
  ingested_at: string;
  model_used_for_ingest: string;
}

export interface Corpus {
  meta: CorpusMeta;
  articles: Article[];
}

export type CitationSource = "body" | "commentary";

export interface Citation {
  article_id: string;
  quote: string;
  source: CitationSource;
}

export type CitationValidationResult =
  | { verified: true }
  | { verified: false; reason: "article_not_found" | "quote_not_found" | "commentary_missing" };
