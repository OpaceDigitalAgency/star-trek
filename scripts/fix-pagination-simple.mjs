
import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Replace the pagination code with a version that explicitly converts to numbers
const updatedContent = content.replace(
  /nextBtn\.disabled = currentPage >= totalPages \|\| isLoading;/g,
  `nextBtn.disabled = Number(currentPage) >= Number(totalPages) || isLoading;`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log('Applied simple pagination fix to src/pages/characters/index.astro');
