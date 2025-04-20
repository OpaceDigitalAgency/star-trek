import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Restore the original pagination code by removing our debugging and fixes
const updatedContent = content.replace(
  /\/\/ Fix: Force the Next button to be enabled for all pages except the last one.*?nextBtn\.disabled = shouldDisableNext;/s,
  `nextBtn.disabled = currentPage >= totalPages || isLoading;`
);

// Remove the debugging we added to the nextBtn click handler
const updatedContent2 = updatedContent.replace(
  /console\.log\('Next button clicked - before check:.*?\);/s,
  ``
);

// Remove the debugging we added to the fetchPageIfNeeded function
const updatedContent3 = updatedContent2.replace(
  /console\.log\('fetchPageIfNeeded called with:.*?\);/s,
  ``
);

// Remove the debugging after currentPage is updated
const updatedContent4 = updatedContent3.replace(
  /console\.log\('Updated currentPage:.*?\);/s,
  ``
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent4);

console.log('Restored original pagination code in src/pages/characters/index.astro');

// Now create a simple fix that explicitly converts the values to numbers
const fixScriptPath = path.resolve('scripts/fix-pagination-simple.mjs');
const fixScriptContent = `
import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Replace the pagination code with a version that explicitly converts to numbers
const updatedContent = content.replace(
  /nextBtn\\.disabled = currentPage >= totalPages \\|\\| isLoading;/g,
  \`nextBtn.disabled = Number(currentPage) >= Number(totalPages) || isLoading;\`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Applied simple pagination fix to src/pages/characters/index.astro');
`;

fs.writeFileSync(fixScriptPath, fixScriptContent);
console.log('Created simple fix script at scripts/fix-pagination-simple.mjs');

// Create a script to check for recent changes
const checkChangesScriptPath = path.resolve('scripts/check-recent-changes.mjs');
const checkChangesScriptContent = `
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Check if git is available
try {
  // Try to get recent changes to the characters/index.astro file
  const output = execSync('git log -p -- src/pages/characters/index.astro | head -n 100', { encoding: 'utf8' });
  console.log('Recent changes to src/pages/characters/index.astro:');
  console.log(output);
} catch (error) {
  console.log('Could not get git history. Git may not be available or this is not a git repository.');
  
  // If git is not available, check the file modification time
  const filePath = path.resolve('src/pages/characters/index.astro');
  try {
    const stats = fs.statSync(filePath);
    console.log('File modification time:', stats.mtime);
  } catch (error) {
    console.log('Could not get file stats:', error.message);
  }
}
`;

fs.writeFileSync(checkChangesScriptPath, checkChangesScriptContent);
console.log('Created script to check recent changes at scripts/check-recent-changes.mjs');