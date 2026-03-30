import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const SKILLS_GAP_PROMPT_DOC_ID = "1S58BTK66zXaqS2j-nCSw_sz98Y-v9Q464VQSW-YePFs";
const SKILLS_DATABASE_DOC_ID = "1ZcgSoi12klLSZqxURX346TwKGSDzCRnYbDGSGhfuGMQ";
const UPSKILLING_TRACKER_DOC_ID = "1pnaX4F2lLII342ukQVO2s62v1cRxFmLyyea2L6ktR18";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

async function getGoogleDocsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
  const authClient = await auth.getClient();
  return google.docs({
    version: "v1",
    auth: authClient as Parameters<typeof google.docs>[0]["auth"],
  });
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

async function appendToDocument(docId: string, content: string): Promise<void> {
  const docs = await getGoogleDocsClient();
  const doc = await docs.documents.get({ documentId: docId });
  const body = doc.data.body?.content ?? [];
  const endIndex = body[body.length - 1].endIndex ?? 1;

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: endIndex - 1 },
            text: "\n\n" + content,
          },
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return Response.json({ error: "Job description is required" }, { status: 400 });
    }

    const [promptTemplate, skillsDatabase] = await Promise.all([
      readDocument(SKILLS_GAP_PROMPT_DOC_ID),
      readDocument(SKILLS_DATABASE_DOC_ID),
    ]);

    const fullPrompt = `${promptTemplate}\n\nCandidate Database:\n${skillsDatabase}\n\nJob Description:\n${jobDescription}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: fullPrompt }],
    });

    const resultText = message.content[0].type === "text" ? message.content[0].text : "";

    const timestamp = new Date().toISOString().split("T")[0];
    const logEntry = `--- ${timestamp} ---\n\n${resultText}`;
    await appendToDocument(UPSKILLING_TRACKER_DOC_ID, logEntry);

    return Response.json({ result: resultText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: `Skills gap analysis failed: ${message}` }, { status: 500 });
  }
}
