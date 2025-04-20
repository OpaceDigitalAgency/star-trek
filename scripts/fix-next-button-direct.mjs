import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// First, restore the original pagination code
const restoredContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?\}\);/g,
  `// Original event listener removed`
);

// Now add a completely new event listener for the "Next" button
const updatedContent = restoredContent.replace(
  /\/\/ Original event listener removed/g,
  `// New event listener for the Next button
    nextBtn.addEventListener('click', function() {
      console.log('Next button clicked directly');
      if (!this.disabled && !isLoading) {
        const nextPage = Number(currentPage) + 1;
        console.log('Navigating to page:', nextPage);
        fetchPageIfNeeded(nextPage);
      } else {
        console.log('Next button is disabled or loading:', {
          disabled: this.disabled,
          isLoading: isLoading,
          currentPage: currentPage,
          totalPages: totalPages
        });
      }
    });`
);

// Also fix the render function to ensure the Next button is enabled correctly
const updatedContent2 = updatedContent.replace(
  /prevBtn\.disabled = .*?currentPage <= 1.*?\|\| isLoading;[\s\S]*?nextBtn\.disabled = .*?currentPage >= totalPages.*?\|\| isLoading;/g,
  `// Simple fix for pagination buttons
        prevBtn.disabled = Number(currentPage) <= 1 || isLoading;
        nextBtn.disabled = Number(currentPage) >= Number(totalPages) || isLoading;
        console.log('Pagination buttons state:', {
          prevDisabled: prevBtn.disabled,
          nextDisabled: nextBtn.disabled,
          currentPage: Number(currentPage),
          totalPages: Number(totalPages),
          isLoading: isLoading
        });`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent2);

console.log('Applied direct fix to the Next button in src/pages/characters/index.astro');