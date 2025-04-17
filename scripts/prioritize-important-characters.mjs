import fs from 'fs';
import path from 'path';

// Read the list of important characters
const importantCharsFile = path.resolve('recurring_chars.txt');
const importantChars = fs.readFileSync(importantCharsFile, 'utf8')
  .split('\n')
  .filter(line => line.trim() !== '')
  .map(line => line.trim());

console.log(`Read ${importantChars.length} important characters from recurring_chars.txt`);

// Update the build-characters-cache.mjs script
const scriptFile = path.resolve('scripts/build-characters-cache.mjs');
let scriptContent = fs.readFileSync(scriptFile, 'utf8');

// Find the importantCharacters array
const importantCharactersRegex = /const importantCharacters = \[([\s\S]*?)\];/;
const match = scriptContent.match(importantCharactersRegex);

if (match) {
  // Extract the current list
  const currentImportantChars = match[1]
    .split(',')
    .map(item => item.trim().replace(/"/g, '').replace(/\n/g, ''))
    .filter(item => item !== '');
  
  console.log(`Found ${currentImportantChars.length} characters in the current importantCharacters array`);
  
  // Combine the lists and remove duplicates
  const combinedChars = [...new Set([...currentImportantChars, ...importantChars])];
  console.log(`Combined list has ${combinedChars.length} unique characters`);
  
  // Format the new array
  const newImportantCharsArray = combinedChars
    .map(char => `  "${char}"`)
    .join(',\n');
  
  // Replace the array in the script
  const newContent = scriptContent.replace(
    importantCharactersRegex,
    `const importantCharacters = [\n${newImportantCharsArray}\n];`
  );
  
  // Write the updated script
  fs.writeFileSync(scriptFile, newContent);
  console.log(`Updated ${scriptFile} with the combined list of important characters`);
} else {
  console.error('Could not find importantCharacters array in the script');
}