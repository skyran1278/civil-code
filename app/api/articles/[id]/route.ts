import { createArticleHandler } from "@/lib/article-handler";
import { getCorpus } from "@/lib/server-deps";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  let corpus;
  try {
    corpus = await getCorpus();
  } catch (e) {
    return Response.json(
      { error: "corpus_not_loaded", message: (e as Error).message },
      { status: 500 }
    );
  }
  const handler = createArticleHandler({ corpus });
  const { id } = await params;
  return handler(id);
}
