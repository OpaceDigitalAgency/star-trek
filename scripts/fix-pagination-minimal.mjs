import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// First, restore the original file
const originalFile = fs.readFileSync(path.resolve('scripts/restore-pagination.mjs'), 'utf8');
const originalContent = originalFile.match(/const originalContent = `([\s\S]*?)`;/)?.[1];

if (originalContent) {
  // Write the original content back to the file
  fs.writeFileSync(filePath, originalContent);
  console.log('Restored original content to src/pages/characters/index.astro');
  
  // Now read the file again
  const restoredContent = fs.readFileSync(filePath, 'utf8');
  
  // Make a minimal change to fix the pagination
  const updatedContent = restoredContent.replace(
    /nextBtn\.disabled = currentPage >= totalPages \|\| isLoading;/g,
    `nextBtn.disabled = Number(currentPage) >= Number(totalPages) || isLoading;`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent);
  console.log('Applied minimal pagination fix to src/pages/characters/index.astro');
} else {
  console.error('Could not find original content in restore-pagination.mjs');
}