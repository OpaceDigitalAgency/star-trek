import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Let's add more comprehensive debugging and fix the issue
const updatedContent = content.replace(
  /nextBtn\.disabled = .*?currentPage >= totalPages.*?\|\| isLoading;/g,
  `// Fix: Force the Next button to be enabled for all pages except the last one
  const shouldDisableNext = Number(currentPage) >= Number(totalPages) || isLoading;
  console.log('Next button disabled calculation:', {
    currentPage: Number(currentPage),
    totalPages: Number(totalPages),
    isLoading,
    comparison: Number(currentPage) >= Number(totalPages),
    shouldDisable: shouldDisableNext
  });
  nextBtn.disabled = shouldDisableNext;`
);

// Add debugging to the nextBtn click handler
const updatedContent2 = updatedContent.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{/g,
  `nextBtn.addEventListener('click', async () => {
    console.log('Next button clicked - before check:', {
      currentPage,
      totalPages,
      isDisabled: nextBtn.disabled,
      isLoading
    });`
);

// Add debugging to the fetchPageIfNeeded function
const updatedContent3 = updatedContent2.replace(
  /async function fetchPageIfNeeded\(pageNumber\) \{/g,
  `async function fetchPageIfNeeded(pageNumber) {
    console.log('fetchPageIfNeeded called with:', {
      requestedPage: pageNumber,
      currentPage,
      totalPages
    });`
);

// Add debugging after currentPage is updated in fetchPageIfNeeded
const updatedContent4 = updatedContent3.replace(
  /currentPage = pageNumber;/g,
  `currentPage = pageNumber;
        console.log('Updated currentPage:', currentPage);`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent4);

console.log('Applied comprehensive pagination fix to src/pages/characters/index.astro');

// Create a test script to verify the fix
const testScriptPath = path.resolve('scripts/test-pagination-comprehensive.mjs');
const testScriptContent = `
// This is a comprehensive test to verify that the pagination comparison works correctly
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
console.log('Created comprehensive test script at scripts/test-pagination-comprehensive.mjs');