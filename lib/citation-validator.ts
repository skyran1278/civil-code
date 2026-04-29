import type { Citation, Corpus, CitationValidationResult } from "./corpus-types";

function normalizeWhitespace(s: string): string {
  return s.replace(/[　\s]+/g, " ").trim();
}

export function validateCitation(
  corpus: Corpus,
  citation: Citation
): CitationValidationResult {
  const article = corpus.articles.find((a) => a.id === citation.article_id);
  if (!article) {
    return { verified: false, reason: "article_not_found" };
  }
  const haystack = citation.source === "body" ? article.body : article.commentary;
  if (haystack === null) {
    return { verified: false, reason: "commentary_missing" };
  }
  if (!normalizeWhitespace(haystack).includes(normalizeWhitespace(citation.quote))) {
    return { verified: false, reason: "quote_not_found" };
  }
  return { verified: true };
}
