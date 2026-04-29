import { createAskHandler } from "@/lib/ask-handler";
import { getCorpus, getClaudeClient, getDefaultModel } from "@/lib/server-deps";

export async function POST(request: Request): Promise<Response> {
  let corpus;
  try {
    corpus = await getCorpus();
  } catch (e) {
    return Response.json(
      { error: "corpus_not_loaded", message: (e as Error).message },
      { status: 500 }
    );
  }

  let claudeClient;
  try {
    claudeClient = getClaudeClient();
  } catch (e) {
    return Response.json(
      { error: "server_misconfigured", message: (e as Error).message },
      { status: 500 }
    );
  }

  const handler = createAskHandler({
    corpus,
    claudeClient,
    defaultModel: getDefaultModel(),
  });
  return handler(request);
}
