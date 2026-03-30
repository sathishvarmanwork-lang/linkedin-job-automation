// Configuration file - stores all document IDs and constants

module.exports = {
  // Google Docs Document IDs (extracted from URLs)
  googleDocs: {
    skillsDatabase: '1ZcgSoi12klLSZqxURX346TwKGSDzCRnYbDGSGhfuGMQ',
    upskillingTracker: '1pnaX4F2lLII342ukQVO2s62v1cRxFmLyyea2L6ktR18',
    cvTemplate: '1L0FyrhJgZaanPmwvdYQhu-Vbvp1YcMN0x3I2P34a-Mg',
    evaluationPrompt: '1SxvYoBBaJTN-87w87rRb3bsC2JbkEI48G4LJ3O3hB3w',
    skillsGapPrompt: '1S58BTK66zXaqS2j-nCSw_sz98Y-v9Q464VQSW-YePFs'
  },

  // Google Drive Folder IDs
  googleDrive: {
    cvFolder: '1nTCdl5Uif-ZpvtdGXn5YMgNVBB6PG9Md'
  },

  // ClickUp Configuration
  clickup: {
    listId: '901410469638',
    spaceName: 'PM Coaching',
    listName: 'Dheeraj'
  },

  // LLM Configuration
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096
  }
};
