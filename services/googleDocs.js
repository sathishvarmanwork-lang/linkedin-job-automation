// Google Docs service - handles reading and writing to Google Docs
const { google } = require('googleapis');
const config = require('../config');

// Authenticate with Google using Service Account credentials
async function authenticate() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file']
  });

  return auth.getClient();
}

// Read a Google Doc and return its content as markdown-style text
async function readDocument(docId) {
  const authClient = await authenticate();
  const docs = google.docs({ version: 'v1', auth: authClient });

  const response = await docs.documents.get({
    documentId: docId
  });

  // Extract text content from document structure
  const content = response.data.body.content;
  let text = '';

  // Process each structural element in the document
  for (const element of content) {
    if (element.paragraph) {
      const paragraphElements = element.paragraph.elements;
      for (const elem of paragraphElements) {
        if (elem.textRun) {
          text += elem.textRun.content;
        }
      }
    }
  }

  return text;
}

// Append content to the end of a Google Doc
async function appendToDocument(docId, content) {
  const authClient = await authenticate();
  const docs = google.docs({ version: 'v1', auth: authClient });

  // Get current document to find the end index
  const doc = await docs.documents.get({
    documentId: docId
  });

  const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex;

  // Insert text at the end of the document
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: endIndex - 1 },
            text: '\n\n' + content
          }
        }
      ]
    }
  });

  return true;
}

// Create a new Google Doc directly in the CV folder
async function createDocument(title, content) {
  const authClient = await authenticate();
  const drive = google.drive({ version: 'v3', auth: authClient });

  // Create a Google Doc file directly in the CV folder
  const fileMetadata = {
    name: title,
    mimeType: 'application/vnd.google-apps.document',
    parents: [config.googleDrive.cvFolder]
  };

  const media = {
    mimeType: 'text/plain',
    body: content
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id'
  });

  const docId = file.data.id;
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

  return {
    docId: docId,
    docUrl: docUrl
  };
}

module.exports = {
  readDocument,
  appendToDocument,
  createDocument
};
