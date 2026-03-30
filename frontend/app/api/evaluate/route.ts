import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const EVALUATION_PROMPT_DOC_ID = "1SxvYoBBaJTN-87w87rRb3bsC2JbkEI48G4LJ3O3hB3w";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

async function getGoogleDocsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/documents"],
  });
  const authClient = await auth.getClient();
  return google.docs({ version: "v1", auth: authClient as Parameters<typeof google.docs>[0]["auth"] });
}

async function readDocument(docId: string): Promise<string> {
  const docs = await getGoogleDocsClient();
  const response = await docs.documents.get({ documentId: docId });
  const content = response.data.body?.content ?? [];
  let text = "";
  for (const element of content) {
    if (element.paragraph) {
      for (const elem of element.paragraph.elements ?? []) {
        if (elem.textRun) {
          text += elem.textRun.content;
        }
      }
    }
  }
  return text;
}

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return Response.json({ error: "Job description is required" }, { status: 400 });
    }

    const promptTemplate = await readDocument(EVALUATION_PROMPT_DOC_ID);

    const fullPrompt = `${promptTemplate}\n\nHere is the job description:\n\n${jobDescription}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: fullPrompt }],
    });

    const resultText = message.content[0].type === "text" ? message.content[0].text : "";

    const scoreMatch = resultText.match(/TOTAL SCORE:\s*(\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    const decisionMatch = resultText.match(/DECISION:\s*(APPLY|DO NOT APPLY)/);
    const decision = decisionMatch ? decisionMatch[1] : "DO NOT APPLY";

    return Response.json({ result: resultText, score, decision });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Evaluation failed: ${message}` }, { status: 500 });
  }
}
