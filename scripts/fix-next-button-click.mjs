import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Fix the nextBtn click handler
const updatedContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{[\s\S]*?if \(currentPage < totalPages && !isLoading\) \{[\s\S]*?try \{[\s\S]*?await fetchPageIfNeeded\(currentPage \+ 1\);[\s\S]*?\} catch[\s\S]*?\}\s*\}\s*\}\);/g,
  `nextBtn.addEventListener('click', function() {
    console.log('Next button clicked - current page:', currentPage, 'total pages:', totalPages);
    
    // Convert to numbers for comparison
    const currentPageNum = Number(currentPage);
    const totalPagesNum = Number(totalPages);
    
    if (currentPageNum < totalPagesNum && !isLoading) {
      try {
        console.log('Fetching next page:', currentPageNum + 1);
        fetchPageIfNeeded(currentPageNum + 1);
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

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Applied fix to the Next button click handler in src/pages/characters/index.astro');