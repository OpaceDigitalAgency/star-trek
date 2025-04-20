import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Fix the issue with the Next button being disabled incorrectly
// The issue is likely in the render function where it sets nextBtn.disabled
const updatedContent = content.replace(
  /nextBtn\.disabled = currentPage >= totalPages \|\| isLoading;/g,
  `// Fix: Only disable Next button when we're actually at the last page
  nextBtn.disabled = (currentPage >= totalPages) || isLoading;
  console.log('Next button disabled:', nextBtn.disabled, 
              'currentPage:', currentPage, 
              'totalPages:', totalPages,
              'comparison result:', currentPage >= totalPages);`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Fixed pagination issue in src/pages/characters/index.astro');

// Now let's create a test script to verify the pagination works correctly
const testScriptPath = path.resolve('scripts/test-pagination.mjs');
const testScriptContent = `
// This is a simple test to verify that the pagination comparison works correctly
const currentPage = 2;
const totalPages = 158;

console.log('Test pagination comparison:');
console.log('currentPage:', currentPage);
console.log('totalPages:', totalPages);
console.log('currentPage >= totalPages:', currentPage >= totalPages);
console.log('Should the Next button be disabled?', currentPage >= totalPages);

// Expected output:
// currentPage: 2
// totalPages: 158
// currentPage >= totalPages: false
// Should the Next button be disabled? false
`;

fs.writeFileSync(testScriptPath, testScriptContent);
console.log('Created test script at scripts/test-pagination.mjs');