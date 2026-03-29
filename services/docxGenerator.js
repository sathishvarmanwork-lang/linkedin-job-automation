// DOCX Generator - creates formatted Word documents
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const fs = require('fs');

// Generate a formatted CV document
async function generateCVDocument(cvContent, filename) {
  const lines = cvContent.split('\n');
  const paragraphs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Blank line for spacing
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // Check if line is all uppercase (section header)
    if (line === line.toUpperCase() && line.length > 3) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 24 // 12pt
            })
          ],
          spacing: { before: 200, after: 100 }
        })
      );
    }
    // Check if line starts with bullet symbol
    else if (line.startsWith('●')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(1).trim(),
          bullet: { level: 0 },
          spacing: { before: 50, after: 50 }
        })
      );
    }
    // Regular text
    else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 20 // 10pt
            })
          ],
          spacing: { before: 50, after: 50 }
        })
      );
    }
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Save to outputs directory
  const outputPath = `/mnt/user-data/outputs/${filename}.docx`;
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

module.exports = {
  generateCVDocument
};
