import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function createSubmissionZip() {
  const outputZipPath = path.resolve('TalentRank_AI_Submission.zip');
  const pdfPath = path.resolve('TalentRank_AI_Technical_Design_Document.pdf');
  const deploymentPath = path.resolve('deployment.md');

  if (!fs.existsSync(pdfPath)) {
    throw new Error('TalentRank_AI_Technical_Design_Document.pdf not found.');
  }

  if (!fs.existsSync(deploymentPath)) {
    throw new Error('deployment.md not found.');
  }

  // Use python3 zipfile module for guaranteed pristine archive containing exactly the 2 files
  execSync(
    `python3 -c "import zipfile; z = zipfile.ZipFile('TalentRank_AI_Submission.zip', 'w', zipfile.ZIP_DEFLATED); z.write('TalentRank_AI_Technical_Design_Document.pdf'); z.write('deployment.md'); z.close()"`
  );

  console.log(`[TalentRank AI] Submission ZIP generated cleanly at: ${outputZipPath}`);
}

createSubmissionZip();
