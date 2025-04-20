import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// First, let's add a console.log to see the entire file content
console.log('File content length:', content.length);

// Find the nextBtn click handler and replace it with a simpler version
const updatedContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage < totalPages && !isLoading\) \{[\s\S]*?try \{[\s\S]*?await fetchPageIfNeeded\(currentPage \+ 1\);[\s\S]*?\} catch[\s\S]*?\}\s*\}\s*\}\);/g,
  `nextBtn.addEventListener('click', async () => {
      console.log('Next button clicked - before check:', {
        currentPage,
        totalPages,
        isDisabled: nextBtn.disabled,
        isLoading
      });
      
      // FIXED: Explicitly convert to numbers for comparison
      if (Number(currentPage) < Number(totalPages) && !isLoading) {
        try {
          console.log('Next button - condition passed, fetching page:', currentPage + 1);
          
          // Force the page number to be a number
          const nextPage = Number(currentPage) + 1;
          console.log('Next page to fetch:', nextPage);
          
          // Call fetchPageIfNeeded with the next page number
          await fetchPageIfNeeded(nextPage);
          
          console.log('After fetchPageIfNeeded, currentPage is now:', currentPage);
        } catch (error) {
          console.error('Error navigating to next page:', error);
        }
      } else {
        console.log('Next button - condition failed:', {
          currentPageCheck: Number(currentPage) < Number(totalPages),
          loadingCheck: !isLoading
        });
      }
    });`
);

// Also fix the fetchPageIfNeeded function to ensure it works correctly
const updatedContent2 = updatedContent.replace(
  /async function fetchPageIfNeeded\(pageNumber\) \{[\s\S]*?try \{[\s\S]*?isLoading = true;[\s\S]*?container\.style\.opacity = '0\.5';[\s\S]*?const pageIndex = pageNumber - 1;[\s\S]*?const start = pageIndex \* PAGE_SIZE;[\s\S]*?const end = start \+ PAGE_SIZE;[\s\S]*?allCharacters = filteredCharacters\.slice\(start, end\);[\s\S]*?currentPage = pageNumber;/g,
  `async function fetchPageIfNeeded(pageNumber) { // pageNumber is 1-based for UI
      console.log('fetchPageIfNeeded called with page:', pageNumber, 'type:', typeof pageNumber);
      if (isLoading) return;

      try {
        isLoading = true;
        container.style.opacity = '0.5';

        // FIXED: Ensure pageNumber is a number
        const pageNum = Number(pageNumber);
        console.log('Converted pageNumber to number:', pageNum);
        
        // Get the requested page
        const pageIndex = pageNum - 1;
        const start = pageIndex * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        allCharacters = filteredCharacters.slice(start, end);
        currentPage = pageNum; // Store as a number`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent2);

console.log('Applied targeted fix to the Next button in src/pages/characters/index.astro');