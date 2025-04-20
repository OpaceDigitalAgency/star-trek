import fs from 'fs';
import path from 'path';

// Read the characters-local.json file
const charactersPath = path.resolve('src/data/characters-local.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

// Count how many characters have the wikiImage field
const withWikiImage = characters.filter(char => char.wikiImage);
console.log(`Characters with wikiImage before fix: ${withWikiImage.length}`);

// Update the wikiImage URLs
let updatedCount = 0;
characters.forEach(char => {
  if (char.wikiImage && char.wikiImage.startsWith('/.netlify/functions/proxy-image')) {
    char.wikiImage = char.wikiImage.replace('/.netlify/functions/proxy-image', '/api/proxy-image');
    updatedCount++;
  }
});

console.log(`Updated ${updatedCount} wikiImage URLs`);

// Write the updated characters back to the file
fs.writeFileSync(charactersPath, JSON.stringify(characters, null, 2));
console.log(`Updated characters-local.json with fixed wikiImage URLs`);

// List the first 5 characters with updated wikiImage URLs
console.log('\nFirst 5 characters with updated wikiImage URLs:');
characters.filter(char => char.wikiImage).slice(0, 5).forEach(char => {
  console.log(`- ${char.name} (${char.uid}): ${char.wikiImage}`);
});