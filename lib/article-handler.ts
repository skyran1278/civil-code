import { getArticleById } from "./corpus";
import type { Corpus } from "./corpus-types";

export interface ArticleHandlerDeps {
  corpus: Corpus;
}

export type ArticleHandler = (id: string) => Promise<Response>;

export function createArticleHandler(deps: ArticleHandlerDeps): ArticleHandler {
  return async (id) => {
    const article = getArticleById(deps.corpus, id);
    if (!article) {
      return Response.json({ error: "not_found", id }, { status: 404 });
    }
    return Response.json(article);
  };
}
