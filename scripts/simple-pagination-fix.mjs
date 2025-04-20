import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// First, restore the original pagination code
const restoredContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?\}\);/g,
  `nextBtn.addEventListener('click', async () => {
      if (currentPage < totalPages && !isLoading) {
        try {
          await fetchPageIfNeeded(currentPage + 1);
        } catch (error) {
          console.error('Error navigating to next page:', error);
        }
      }
    });`
);

// Restore the fetchPageIfNeeded function
const restoredContent2 = restoredContent.replace(
  /async function fetchPageIfNeeded\(pageNumber\) \{[\s\S]*?currentPage = .*?;/g,
  `async function fetchPageIfNeeded(pageNumber) { // pageNumber is 1-based for UI
      if (isLoading) return;

      try {
        isLoading = true;
        container.style.opacity = '0.5';

        // Get the requested page
        const pageIndex = pageNumber - 1;
        const start = pageIndex * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        allCharacters = filteredCharacters.slice(start, end);
        currentPage = pageNumber;`
);

// Now add a simple fix to the render function to ensure the "Next" button is enabled correctly
const fixedContent = restoredContent2.replace(
  /nextBtn\.disabled = .*?currentPage >= totalPages.*?\|\| isLoading;/g,
  `// Simple fix: Force the Next button to be enabled for all pages except the last one
        const lastPage = Number(totalPages);
        const currentPageNum = Number(currentPage);
        nextBtn.disabled = (currentPageNum >= lastPage) || isLoading;
        console.log('Next button state:', { 
          disabled: nextBtn.disabled, 
          currentPage: currentPageNum, 
          totalPages: lastPage,
          comparison: currentPageNum >= lastPage
        });`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, fixedContent);

console.log('Applied simple pagination fix to src/pages/characters/index.astro');