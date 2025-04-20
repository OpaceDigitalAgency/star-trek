import fs from 'fs';
import path from 'path';

// Read the characters.json file
const charactersPath = path.resolve('src/data/characters.json');
const characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

// Count how many characters have the important flag set to true
const importantCharacters = characters.filter(char => char.important === true);

console.log(`Total characters: ${characters.length}`);
console.log(`Characters with important=true: ${importantCharacters.length}`);

// List the first 10 important characters
console.log('\nFirst 10 important characters:');
importantCharacters.slice(0, 10).forEach(char => {
  console.log(`- ${char.name} (${char.uid})`);
});

// Check if any characters have isImportant instead of important
const isImportantCharacters = characters.filter(char => char.isImportant === true);
console.log(`\nCharacters with isImportant=true: ${isImportantCharacters.length}`);