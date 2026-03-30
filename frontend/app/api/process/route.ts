import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";

const SKILLS_GAP_PROMPT_DOC_ID = "1S58BTK66zXaqS2j-nCSw_sz98Y-v9Q464VQSW-YePFs";
const CV_PROMPT_DOC_ID = "15bfmMeUdAq_TBc_1GAcztmuqfmuGC5rmqW-MWV-Zp0U";
const SKILLS_DATABASE_DOC_ID = "1ZcgSoi12klLSZqxURX346TwKGSDzCRnYbDGSGhfuGMQ";
const CV_TEMPLATE_DOC_ID = "1v72_OeNOWDqpatrBf-UtnewocbQVtFO7aFN-l39ptOo";
const UPSKILLING_TRACKER_DOC_ID = "1pnaX4F2lLII342ukQVO2s62v1cRxFmLyyea2L6ktR18";
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx7PalaIcyk5QRNIe9gnH-hvZCwICUS_J_ikfB5K4so9jcUXiXN-3nhRVdhMZpNtOriWg/exec";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8192;

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

async function createCVGoogleDoc(
  title: string,
  content: string
): Promise<{ docId: string; docUrl: string; pdfBase64: string; pdfFilename: string }> {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Apps Script error: ${res.status}`);
  }

  return res.json();
}

function parseCompanyAndTitle(cvOutput: string): {
  companyName: string;
  jobTitle: string;
} {
  const companyMatch = cvOutput.match(/COMPANY_NAME:\s*(.+)/);
  const jobTitleMatch = cvOutput.match(/JOB_TITLE:\s*(.+)/);
  return {
    companyName: companyMatch ? companyMatch[1].trim() : "Unknown Company",
    jobTitle: jobTitleMatch ? jobTitleMatch[1].trim() : "Position",
  };
}

function extractCVContent(cvOutput: string): string {
  const match = cvOutput.match(/---CV START---\s*([\s\S]+?)\s*---CV END---/);
  return match ? match[1].trim() : cvOutput;
}

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    if (
      !jobDescription ||
      typeof jobDescription !== "string" ||
      !jobDescription.trim()
    ) {
      return Response.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch all docs in parallel
    const [skillsGapPrompt, cvPrompt, skillsDatabase, cvTemplate] =
      await Promise.all([
        readDocument(SKILLS_GAP_PROMPT_DOC_ID),
        readDocument(CV_PROMPT_DOC_ID),
        readDocument(SKILLS_DATABASE_DOC_ID),
        readDocument(CV_TEMPLATE_DOC_ID),
      ]);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Step 2: Run skills gap + CV generation in parallel
    const [skillsGapMessage, cvMessage] = await Promise.all([
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: `${skillsGapPrompt}\n\nCandidate Database:\n${skillsDatabase}\n\nJob Description:\n${jobDescription}`,
          },
        ],
      }),
      anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: `${cvPrompt}\n\nDatabase:\n${skillsDatabase}\n\nSample CV:\n${cvTemplate}\n\nJob Description:\n${jobDescription}\n\nCRITICAL: Before the CV content, output these two lines exactly:\nCOMPANY_NAME: [company name extracted from job description]\nJOB_TITLE: [job title extracted from job description]\n---CV START---\n[Your CV output here]\n---CV END---`,
          },
        ],
      }),
    ]);

    const skillsGapResult =
      skillsGapMessage.content[0].type === "text"
        ? skillsGapMessage.content[0].text
        : "";
    const cvRawResult =
      cvMessage.content[0].type === "text" ? cvMessage.content[0].text : "";

    const { companyName, jobTitle } = parseCompanyAndTitle(cvRawResult);
    const cvContent = extractCVContent(cvRawResult);

    // Step 3: Log skills gap + create CV doc in parallel
    const docTitle = `Sathish - ${companyName} ${jobTitle}`;

    const [, cvDoc] = await Promise.all([
      appendToDocument(
        UPSKILLING_TRACKER_DOC_ID,
        `--- ${new Date().toISOString().split("T")[0]} ---\n${companyName} - ${jobTitle}\n\n${skillsGapResult}`
      ),
      createCVGoogleDoc(docTitle, cvContent),
    ]);

    return Response.json({
      skillsGap: skillsGapResult,
      cvDocUrl: cvDoc.docUrl,
      pdfBase64: cvDoc.pdfBase64,
      pdfFilename: cvDoc.pdfFilename,
      companyName,
      jobTitle,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Processing failed: ${message}` },
      { status: 500 }
    );
  }
}
