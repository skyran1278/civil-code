import type { Article, Corpus } from "./corpus-types";

function serializeArticle(article: Article): string {
  const header = `### 條 ${article.id} — ${article.subsection}`;
  const breadcrumb = `> ${article.chapter} / ${article.section}`;
  const body = `**【規範本文】**\n${article.body}`;
  const commentary = article.commentary
    ? `\n\n**【解說】**\n${article.commentary}`
    : "";
  return `${header}\n${breadcrumb}\n\n${body}${commentary}`;
}

export function serializeCorpusToMarkdown(corpus: Corpus): string {
  const head = `# ${corpus.meta.law_name}\n\n版本：${corpus.meta.version}\n來源：${corpus.meta.source_url}\n`;
  const articles = corpus.articles.map(serializeArticle).join("\n\n---\n\n");
  return `${head}\n${articles}\n`;
}

export function buildSystemPrompt(corpus: Corpus): string {
  return `你是「${corpus.meta.law_name}」查詢助手。

規則：
1. 你只能根據下方〈法規全文〉回答，**不得依靠任何訓練資料**或一般常識補充。
2. 每一個事實論述都必須附上引用：條編號 + 取自規範本文或解說的 **verbatim 原文片段**（逐字、不得改寫、不得省略空白與全形符號）。
3. 若使用者問題在法規中找不到對應依據，answer 欄位必須是「規範中未明訂」，並回傳空 citations 陣列。
4. 引用片段必須是 body 或 commentary 中**實際出現的連續字串**；server 端會做字串比對驗證。任何拼湊、改寫或近似都會被拒絕。
5. 用繁體中文回答，技術名詞（如 d、As、fc'）保留原符號。

請呼叫 \`answer_with_citations\` 工具回答；citations 必須引用 body 或 commentary 的 verbatim 片段。

---
〈法規全文〉

${serializeCorpusToMarkdown(corpus)}`;
}
