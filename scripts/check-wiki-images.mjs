import fs from 'fs';
import path from 'path';

// Read the characters-local.json file
const charactersPath = path.resolve('src/data/characters-local.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

// Count how many characters have the wikiImage field
const withWikiImage = characters.filter(char => char.wikiImage);
const withoutWikiImage = characters.filter(char => !char.wikiImage);

console.log(`Total characters: ${characters.length}`);
console.log(`Characters with wikiImage: ${withWikiImage.length}`);
console.log(`Characters without wikiImage: ${withoutWikiImage.length}`);

// List the first 10 characters with wikiImage
console.log('\nFirst 10 characters with wikiImage:');
withWikiImage.slice(0, 10).forEach(char => {
  console.log(`- ${char.name} (${char.uid}): ${char.wikiImage}`);
});

// List the first 10 characters without wikiImage
console.log('\nFirst 10 characters without wikiImage:');
withoutWikiImage.slice(0, 10).forEach(char => {
  console.log(`- ${char.name} (${char.uid})`);
});

// Check if any important characters have wikiImage
const importantWithWikiImage = characters.filter(char => char.important && char.wikiImage);
const importantWithoutWikiImage = characters.filter(char => char.important && !char.wikiImage);

console.log(`\nImportant characters with wikiImage: ${importantWithWikiImage.length}`);
console.log(`Important characters without wikiImage: ${importantWithoutWikiImage.length}`);