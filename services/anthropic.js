// Anthropic service - handles Claude API calls for job analysis
const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Prompt 1: Check if job matches parameters
async function checkJobMatch(jobDescription) {
  const prompt = `🔎 Job Evaluation Prompt
I am applying to jobs. A job must satisfy ALL of the following parameters to be considered suitable.

Parameters (Each worth 20 points, Total = 100 points)

1. Role Type (20 points)
The job must clearly be one of the following roles (or a direct equivalent):
("product manager" OR "technical product manager" OR "digital product manager" OR "product owner" OR "product analyst" OR "product operations" OR "program manager" OR "technical program manager" OR "project manager" OR "technical project manager" OR "delivery manager" OR "business analyst" OR "strategy analyst" OR "solutions consultant" OR "technology consultant")

2. Technology / Software Focus (20 points)
The job must primarily be a software or technology role, where the core work is focused on digital systems, applications, platforms, or data, such as:
* Enterprise software
* Internal systems
* SaaS platforms
* APIs and integrations
* Cloud services
* Analytics, data, AI, automation
The company itself does NOT need to be tech-first, as long as the role itself is clearly a tech/software role.
❌ Hardware-only, manufacturing-only, logistics-only, or non-software roles should be excluded.

3. Chinese / Mandarin Language Requirement (20 points)
The role must NOT require Chinese / Mandarin proficiency.
* If Mandarin is required or mandatory → 0 points (automatic rejection)
* If Mandarin is not mentioned or only optional → 20 points

4. Location Constraint (20 points)
The job must meet one of the following conditions:
* The role is based in Klang Valley, Malaysia (e.g. Kuala Lumpur, Petaling Jaya, Cyberjaya, Subang, Bangsar, Damansara), OR
* The role is outside Klang Valley but allows full remote work (or clearly supports remote work from Malaysia)
❌ If the role is based outside Klang Valley and requires onsite presence there → 0 points

5. Company Type (20 points)
The company must be Product-based (NOT service/agency/consulting).
* Product-based company → Builds, owns, and continuously evolves its own digital products or platforms (e.g. SaaS, fintech apps, internal platforms, consumer or enterprise software) → 20 points
* Service / Agency / Consulting company → Primarily delivers projects, implementations, outsourcing, consulting, or client services for other companies → 0 points

Instructions

For each parameter (1–5):
* State SATISFIES (20 points) or DOES NOT SATISFY (0 points)
* Provide 1–2 concise bullet points explaining why

Output Format (STRICT - follow exactly):

Parameter 1 - Role Type: [SATISFIES / DOES NOT SATISFY] ([20 or 0]/20 points)
- Explanation

Parameter 2 - Tech Focus: [SATISFIES / DOES NOT SATISFY] ([20 or 0]/20 points)
- Explanation

Parameter 3 - Mandarin: [NOT REQUIRED / REQUIRED] ([20 or 0]/20 points)
- Explanation

Parameter 4 - Location: [SATISFIES / DOES NOT SATISFY] ([20 or 0]/20 points)
- Explanation

Parameter 5 - Company Type: [Product-based / Service-Agency] ([20 or 0]/20 points)
- Explanation

TOTAL SCORE: [X]/100
DECISION: [APPLY / DO NOT APPLY]

If score is 100/100 → APPLY
If score is less than 100 → DO NOT APPLY

Here is the job description:

${jobDescription}`;

  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  return message.content[0].text;
}

// Prompt 2: Analyze skills gap
async function analyzeSkillsGap(jobDescription, skillsDbContent) {
  const prompt = `Compare this Job Description against my personal database and identify the TOP 3 MOST IMPORTANT SKILL GAPS.

Output ONLY the skills in this exact format (no explanations, no recommendations, no extra text):

**Skill Gap 1: [Parent Skill Name]**
- [Child skill/tool/knowledge area 1]
- [Child skill/tool/knowledge area 2]
- [Child skill/tool/knowledge area 3]

**Skill Gap 2: [Parent Skill Name]**
- [Child skill/tool/knowledge area 1]
- [Child skill/tool/knowledge area 2]
- [Child skill/tool/knowledge area 3]

**Skill Gap 3: [Parent Skill Name]**
- [Child skill/tool/knowledge area 1]
- [Child skill/tool/knowledge area 2]
- [Child skill/tool/knowledge area 3]

Rules:
- Use specific, concrete, actionable skills (not vague like "engineering skills")
- Maximum 3 sub-bullets per skill gap
- Do NOT include: domain analysis, learning timeline, application advice, HR probability, or any other commentary
- Output ONLY the 3 skill gaps in the format above

My Personal Database:
${skillsDbContent}

Job Description:
${jobDescription}`;

  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  return message.content[0].text;
}

// Prompt 3: Generate CV
async function generateCV(jobDescription, skillsDbContent, cvTemplateContent) {
  const prompt = `Study these documents and generate a tailored CV.

My Skills Database:
${skillsDbContent}

CV Template Instructions:
${cvTemplateContent}

Job Description:
${jobDescription}

CRITICAL OUTPUT REQUIREMENTS:

1. Extract company name and job title from the job description

2. Output in this EXACT format:

COMPANY_NAME: [company name only, no extra text]
JOB_TITLE: [job title only, no extra text]
---CV START---
[CV content here in plain text format - see rules below]
---CV END---

3. CV FORMATTING RULES (STRICT):
   - Use UPPERCASE for section headers (PROFESSIONAL SUMMARY, KEY ACHIEVEMENTS, etc.)
   - Use ● (bullet symbol) for all bullet points, NOT dashes or asterisks
   - NO markdown formatting (no **, no ##, no _)
   - Use plain text only with visual separation through spacing and UPPERCASE
   - Each section separated by one blank line
   - Do NOT include any "FORMATTING INSTRUCTIONS" section
   - Do NOT include any explanatory text after the CV

4. Follow the structure and content guidance from the CV Template, but output in plain text format as specified above.`;

  const message = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  return message.content[0].text;
}

module.exports = {
  checkJobMatch,
  analyzeSkillsGap,
  generateCV
};
