import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Find the render function and replace the button disabling logic
const updatedContent = content.replace(
  /function render\(\) \{[\s\S]*?nextBtn\.disabled = .*?currentPage >= totalPages.*?\|\| isLoading;/g,
  `function render() {
      try {
        console.log("Render called - current page:", currentPage, "total pages:", totalPages, "total characters:", totalCharacters);
        
        // Update total count display based on the overall total for the current filter set
        countBadge.textContent = \`\${totalCharacters} characters found\`;

        // Update pagination display (uses overall totalPages for the current filter set)
        pageNum.textContent = currentPage;
        totalNum.textContent = totalPages; // Display the overall total pages

        // FIXED: Explicitly convert to numbers and use a simple comparison
        prevBtn.disabled = Number(currentPage) <= 1 || isLoading;
        
        // FIXED: Force the Next button to be enabled for all pages except the last one
        const isLastPage = Number(currentPage) >= Number(totalPages);
        nextBtn.disabled = isLastPage || isLoading;
        console.log('Next button disabled state:', nextBtn.disabled, 'currentPage:', currentPage, 'totalPages:', totalPages);`
);

// Also fix the nextBtn click handler to ensure it works correctly
const updatedContent2 = updatedContent.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage < totalPages && !isLoading\) \{/g,
  `nextBtn.addEventListener('click', async () => {
      console.log('Next button clicked - current page:', currentPage, 'total pages:', totalPages);
      // FIXED: Explicitly convert to numbers for comparison
      if (Number(currentPage) < Number(totalPages) && !isLoading) {`
);

// Also fix the prevBtn click handler to ensure it works correctly
const updatedContent3 = updatedContent2.replace(
  /prevBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage > 1 && !isLoading\) \{/g,
  `prevBtn.addEventListener('click', async () => {
      console.log('Previous button clicked - current page:', currentPage, 'total pages:', totalPages);
      // FIXED: Explicitly convert to numbers for comparison
      if (Number(currentPage) > 1 && !isLoading) {`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent3);

console.log('Applied direct pagination fix to src/pages/characters/index.astro');