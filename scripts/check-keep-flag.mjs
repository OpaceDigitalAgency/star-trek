import fs from 'fs';
import path from 'path';

// Read the characters-local.json file
const charactersPath = path.resolve('src/data/characters-local.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

// Count how many characters have the keep flag
const withKeep = characters.filter(char => char.keep === true);
const withoutKeep = characters.filter(char => char.keep !== true);

console.log(`Total characters: ${characters.length}`);
console.log(`Characters with keep=true: ${withKeep.length}`);
console.log(`Characters without keep=true: ${withoutKeep.length}`);

// List the first 10 characters with keep=true
console.log('\nFirst 10 characters with keep=true:');
withKeep.slice(0, 10).forEach(char => {
  console.log(`- ${char.name} (${char.uid})`);
});