// Main automation script - orchestrates the job application workflow
const googleDocs = require('./services/googleDocs');
const anthropic = require('./services/anthropic');
const clickup = require('./services/clickup');
const docxGenerator = require('./services/docxGenerator');
const config = require('./config');
const readline = require('readline');

// Main function - processes a job description through the complete pipeline
async function processJob(jobDescription, jobUrl) {
  console.log('\n🔄 Processing job application...\n');

  try {
    // Step 1: Read Skills Database and CV Template from Google Docs
    console.log('📖 Reading Skills Database...');
    const skillsDbContent = await googleDocs.readDocument(config.googleDocs.skillsDatabase);
    
    console.log('📖 Reading CV Template...');
    const cvTemplateContent = await googleDocs.readDocument(config.googleDocs.cvTemplate);

    // Step 2: Check if job matches parameters (Prompt 1)
    console.log('\n✅ Running job match analysis...');
    const jobMatchResult = await anthropic.checkJobMatch(jobDescription);
    console.log('\n--- JOB MATCH RESULT ---');
    console.log(jobMatchResult);

    // Parse score from result
    const scoreMatch = jobMatchResult.match(/TOTAL SCORE:\s*(\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

    console.log(`\n📊 Score: ${score}/100`);

    // Check if score is less than 100 (any parameter failed)
    if (score < 100) {
      console.log('\n❌ Job does not meet all mandatory parameters. Stopping process.\n');
      return;
    }

    console.log('✅ All parameters satisfied. Continuing...\n');

    // Step 3: Analyze skills gap (Prompt 2)
    console.log('🔍 Analyzing skills gap...');
    const skillsGapResult = await anthropic.analyzeSkillsGap(jobDescription, skillsDbContent);
    console.log('\n--- SKILLS GAP ANALYSIS ---');
    console.log(skillsGapResult);

    // Step 4: Log skills gap to Upskilling Tracker
    console.log('\n📝 Logging skills gap to Google Docs...');
    const timestamp = new Date().toISOString().split('T')[0];
    const logEntry = `--- ${timestamp} ---\nJob: ${jobUrl}\n\n${skillsGapResult}`;
    await googleDocs.appendToDocument(config.googleDocs.upskillingTracker, logEntry);
    console.log('✓ Logged to Upskilling Tracker');

    // Step 5: Generate CV (Prompt 3)
    console.log('\n📄 Generating CV...');
    const cvResult = await anthropic.generateCV(jobDescription, skillsDbContent, cvTemplateContent);

    // Parse company name, job title, and CV content
    const companyMatch = cvResult.match(/COMPANY_NAME:\s*(.+)/);
    const jobTitleMatch = cvResult.match(/JOB_TITLE:\s*(.+)/);
    const cvContentMatch = cvResult.match(/---CV START---\s*([\s\S]+?)\s*---CV END---/);

    const companyName = companyMatch ? companyMatch[1].trim() : 'Unknown Company';
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'Position';
    const cvContent = cvContentMatch ? cvContentMatch[1].trim() : cvResult;

    // Create DOCX file
    const docFilename = `Sathish - ${companyName} ${jobTitle}`;
    console.log(`\n📄 Creating CV document: "${docFilename}.docx"...`);
    const cvPath = await docxGenerator.generateCVDocument(cvContent, docFilename);
    console.log(`✓ CV created: ${cvPath}`);

    // Step 6: Create ClickUp task
    console.log('\n📌 Creating ClickUp task...');
    const clickUpTaskName = `${companyName} ${jobTitle}`;
    await clickup.createJobTask(clickUpTaskName, jobUrl);
    console.log('✓ Task created in ClickUp');

    console.log('\n✅ Process complete!\n');
    console.log('📎 Download CV from Files panel (right sidebar) or outputs folder');

  } catch (error) {
    console.error('\n❌ Error processing job:', error.message);
    console.error(error);
  }
}

// Interactive input handler
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('=== LinkedIn Job Automation ===\n');
  
  rl.question('Paste job URL: ', (jobUrl) => {
    console.log('\nPaste job description (end with Ctrl+D on a new line):\n');
    
    let jobDescription = '';
    
    rl.on('line', (line) => {
      jobDescription += line + '\n';
    });

    rl.on('close', async () => {
      if (jobDescription.trim()) {
        await processJob(jobDescription.trim(), jobUrl.trim());
      } else {
        console.log('No job description provided.');
      }
    });
  });
}

// Run the script
main();
