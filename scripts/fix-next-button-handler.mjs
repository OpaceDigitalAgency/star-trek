import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// First, let's check if the file contains the nextBtn click handler
if (!content.includes('nextBtn.addEventListener(\'click\'')) {
  console.error('Could not find nextBtn click handler in the file');
  process.exit(1);
}

// Replace the nextBtn click handler with a simpler version
const updatedContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage < totalPages && !isLoading\) \{[\s\S]*?try \{[\s\S]*?await fetchPageIfNeeded\(currentPage \+ 1\);[\s\S]*?\} catch[\s\S]*?\}\s*\}\s*\}\);/g,
  `nextBtn.addEventListener('click', function() {
      // Convert to numbers for comparison
      const currentPageNum = Number(currentPage);
      const totalPagesNum = Number(totalPages);
      
      if (currentPageNum < totalPagesNum && !isLoading) {
        try {
          // Use the next page number
          const nextPage = currentPageNum + 1;
          
          // Call fetchPageIfNeeded with the next page number
          fetchPageIfNeeded(nextPage);
        } catch (error) {
          console.error('Error navigating to next page:', error);
        }
      }
    });`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Applied fix to the Next button click handler in src/pages/characters/index.astro');

// Also fix the fetchPageIfNeeded function to ensure it works correctly
const updatedContent2 = fs.readFileSync(filePath, 'utf8').replace(
  /async function fetchPageIfNeeded\(pageNumber\) \{[\s\S]*?if \(isLoading\) return;[\s\S]*?try \{[\s\S]*?isLoading = true;[\s\S]*?container\.style\.opacity = '0\.5';[\s\S]*?const pageIndex = pageNumber - 1;[\s\S]*?const start = pageIndex \* PAGE_SIZE;[\s\S]*?const end = start \+ PAGE_SIZE;[\s\S]*?allCharacters = filteredCharacters\.slice\(start, end\);[\s\S]*?currentPage = pageNumber;/g,
  `async function fetchPageIfNeeded(pageNumber) { // pageNumber is 1-based for UI
      if (isLoading) return;

      try {
        isLoading = true;
        container.style.opacity = '0.5';

        // Ensure pageNumber is a number
        const pageNum = Number(pageNumber);
        
        // Get the requested page
        const pageIndex = pageNum - 1;
        const start = pageIndex * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        allCharacters = filteredCharacters.slice(start, end);
        currentPage = pageNum; // Store as a number`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent2);

console.log('Applied fix to the fetchPageIfNeeded function in src/pages/characters/index.astro');