import fs from 'fs';
import path from 'path';

// Function to validate character names
function validateCharacterName(name) {
  // Check for common meta-categories
  const metaCategories = [
    "Character crossover appearances",
    "Cast members who directed",
    "Regular cast characters by rank",
    "Category:Production lists",
    "TOS regular cast non-appearances",
    "TAS regular cast non-appearances",
    "TNG regular cast non-appearances",
    "DS9 regular cast non-appearances",
    "VOY regular cast non-appearances",
    "ENT regular cast non-appearances",
    "DIS regular cast non-appearances",
    "PIC regular cast non-appearances",
    "LD regular cast non-appearances",
    "PRO regular cast non-appearances",
    "SNW regular cast non-appearances"
  ];
  
  if (metaCategories.includes(name)) {
    console.log(`Filtering out meta-category: ${name}`);
    return false;
  }
  
  // Known actor names that might be in the list
  const actorNames = [
    "Patrick Stewart",
    "Jonathan Frakes",
    "Brent Spiner",
    "LeVar Burton",
    "Michael Dorn",
    "Gates McFadden",
    "Marina Sirtis",
    "Denise Crosby",
    "Wil Wheaton",
    "Diana Muldaur",
    "Avery Brooks",
    "Nana Visitor",
    "Terry Farrell",
    "Alexander Siddig",
    "Colm Meaney",
    "Nicole de Boer",
    "Armin Shimerman",
    "Cirroc Lofton",
    "Kate Mulgrew",
    "Robert Beltran",
    "Tim Russ",
    "Robert Duncan McNeill",
    "Roxann Dawson",
    "Garrett Wang",
    "Jeri Ryan",
    "Robert Picardo",
    "Ethan Phillips",
    "Jennifer Lien",
    "Scott Bakula",
    "Jolene Blalock",
    "Connor Trinneer",
    "Dominic Keating",
    "Anthony Montgomery",
    "Linda Park",
    "John Billingsley"
  ];
  
  if (actorNames.includes(name)) {
    console.log(`Filtering out actor name: ${name}`);
    return false;
  }
  
  return true;
}

// Read the list of important characters
const importantCharsFile = path.resolve('recurring_chars.txt');
const importantChars = fs.readFileSync(importantCharsFile, 'utf8')
  .split('\n')
  .filter(line => line.trim() !== '')
  .map(line => line.trim())
  .filter(validateCharacterName); // Apply validation

console.log(`Read ${importantChars.length} valid character names from recurring_chars.txt`);

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
  
  // Use only the new list from recurring_chars.txt
  const combinedChars = [...new Set([...importantChars])];
  console.log(`New list has ${combinedChars.length} unique characters`);
  
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
  console.log(`Updated ${scriptFile} with the new curated list of important characters`);
} else {
  console.error('Could not find importantCharacters array in the script');
}