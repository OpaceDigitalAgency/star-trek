import fs from 'fs';
import path from 'path';

// Path to the characters/index.astro file
const filePath = path.resolve('src/pages/characters/index.astro');

// Read the file
const content = fs.readFileSync(filePath, 'utf8');

// Add debugging to the nextBtn event listener
const updatedContent = content.replace(
  /nextBtn\.addEventListener\('click', async \(\) => \{\s*if \(currentPage < totalPages && !isLoading\) \{\s*try \{/,
  `nextBtn.addEventListener('click', async () => {
      console.log('Next button clicked - current page:', currentPage, 'total pages:', totalPages);
      if (currentPage < totalPages && !isLoading) {
        try {`
);

// Add debugging to the fetchPageIfNeeded function
const updatedContent2 = updatedContent.replace(
  /async function fetchPageIfNeeded\(pageNumber\) \{.*?if \(isLoading\) return;/s,
  `async function fetchPageIfNeeded(pageNumber) { // pageNumber is 1-based for UI
      console.log('fetchPageIfNeeded called with page:', pageNumber);
      if (isLoading) return;`
);

// Add debugging to the render function
const updatedContent3 = updatedContent2.replace(
  /function render\(\) \{\s*try \{/,
  `function render() {
      try {`
);

// Add debugging to the nextBtn.disabled line
const updatedContent4 = updatedContent3.replace(
  /nextBtn\.disabled = currentPage >= totalPages \|\| isLoading;/,
  `nextBtn.disabled = currentPage >= totalPages || isLoading;
        console.log('Next button disabled state:', nextBtn.disabled, 'currentPage:', currentPage, 'totalPages:', totalPages);`
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent4);

console.log('Added debugging to pagination code in src/pages/characters/index.astro');