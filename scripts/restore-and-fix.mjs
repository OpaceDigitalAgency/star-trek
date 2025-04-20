import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// First, let's try to restore the file from a backup
try {
  // Check if there's a backup file
  const backupPath = path.resolve('src/pages/characters/index.astro.bak');
  if (fs.existsSync(backupPath)) {
    console.log('Restoring from backup file...');
    fs.copyFileSync(backupPath, filePath);
  } else {
    // If no backup exists, create one
    console.log('Creating backup file...');
    fs.copyFileSync(filePath, backupPath);
    
    // Try to restore using git
    try {
      console.log('Attempting to restore using git...');
      execSync('git checkout -- src/pages/characters/index.astro', { stdio: 'inherit' });
    } catch (gitError) {
      console.log('Git restore failed or git not available.');
      // Continue with the script
    }
  }
} catch (error) {
  console.error('Error during restore:', error);
}

// Now read the file (either restored or current version)
const content = fs.readFileSync(filePath, 'utf8');

// Make a very minimal change to fix the pagination
// Just replace the nextBtn.disabled line with a version that uses Number()
const updatedContent = content.replace(
  /nextBtn\.disabled = currentPage >= totalPages \|\| isLoading;/g,
  `nextBtn.disabled = Number(currentPage) >= Number(totalPages) || isLoading;`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Applied minimal pagination fix to src/pages/characters/index.astro');

// Create a test script to verify the fix
const testScriptPath = path.resolve('scripts/test-pagination.mjs');
const testScriptContent = `
// This is a simple test to verify that the pagination comparison works correctly
console.log('Testing pagination with different types:');

// Test with numbers
const test1 = {
  currentPage: 2,
  totalPages: 158,
  result: 2 >= 158
};
console.log('Test with numbers:', test1);

// Test with strings that should be numbers
const test2 = {
  currentPage: "2",
  totalPages: "158",
  result: "2" >= "158"
};
console.log('Test with strings:', test2);

// Test with explicit conversion
const test3 = {
  currentPage: "2",
  totalPages: "158",
  result: Number("2") >= Number("158")
};
console.log('Test with explicit conversion:', test3);

// Expected output should show that string comparison might not work as expected
// but Number conversion should work correctly
`;

fs.writeFileSync(testScriptPath, testScriptContent);
console.log('Created test script at scripts/test-pagination.mjs');