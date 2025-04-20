import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Fix the nextBtn click handler
const updatedContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage < totalPages && !isLoading\) \{[\s\S]*?try \{[\s\S]*?await fetchPageIfNeeded\(currentPage \+ 1\);[\s\S]*?\} catch[\s\S]*?\}\s*\}\s*\}\);/g,
  `nextBtn.addEventListener('click', async () => {
      console.log('Next button clicked - current page:', currentPage, 'total pages:', totalPages);
      
      // FIXED: Explicitly convert to numbers for comparison
      const currentPageNum = Number(currentPage);
      const totalPagesNum = Number(totalPages);
      
      if (currentPageNum < totalPagesNum && !isLoading) {
        try {
          console.log('Fetching next page:', currentPageNum + 1);
          await fetchPageIfNeeded(currentPageNum + 1);
        } catch (error) {
          console.error('Error navigating to next page:', error);
        }
      } else {
        console.log('Cannot navigate to next page:', { 
          currentPage: currentPageNum, 
          totalPages: totalPagesNum,
          isLoading,
          condition: currentPageNum < totalPagesNum && !isLoading
        });
      }
    });`
);

// Fix the render function to ensure the Next button is enabled correctly
const updatedContent2 = updatedContent.replace(
  /nextBtn\.disabled = .*?currentPage >= totalPages.*?\|\| isLoading;/g,
  `// FIXED: Explicitly convert to numbers and use a simple comparison
        const currentPageNum = Number(currentPage);
        const totalPagesNum = Number(totalPages);
        const isLastPage = currentPageNum >= totalPagesNum;
        
        nextBtn.disabled = isLastPage || isLoading;
        
        console.log('Next button state:', { 
          disabled: nextBtn.disabled, 
          currentPage: currentPageNum, 
          totalPages: totalPagesNum,
          isLastPage,
          isLoading
        });`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent2);

console.log('Applied targeted fix to the Next button in src/pages/characters/index.astro');