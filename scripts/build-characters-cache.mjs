import fs from 'fs';
import path from 'path';
import { stapiService } from '../src/services/stapiService.js';

console.time('harvest');
const output = path.resolve('src/data/characters.json');

// Get all characters from STAPI
console.log('Fetching all characters from STAPI...');
// Force a fresh fetch by setting SKIP_CHAR_CACHE=true
process.env.SKIP_CHAR_CACHE = 'true';
const characters = await stapiService.getAllCharacters();
console.log(`Fetched ${characters.length} characters from STAPI`);

// Define a list of primary actors (keep=true) and important characters
const primaryActors = [
  "James T. Kirk",
  "Spock",
  "Leonard McCoy",
  "Jean-Luc Picard",
  "William Riker",
  "Data",
  "Benjamin Sisko",
  "Kira Nerys",
  "Kathryn Janeway",
  "Chakotay",
  "Seven of Nine",
  "The Doctor",
  "Jonathan Archer",
  "T'Pol",
  "Michael Burnham",
  "Christopher Pike"
];

// Define a list of important characters to prioritize
const importantCharacters = [
  "James T. Kirk",
  "Spock",
  "Leonard McCoy",
  "Montgomery Scott",
  "Hikaru Sulu",
  "Pavel Chekov",
  "Nyota Uhura",
  "Christine Chapel",
  "Janice Rand",
  "Jean-Luc Picard",
  "William Riker",
  "Data",
  "Geordi La Forge",
  "Worf",
  "Beverly Crusher",
  "Deanna Troi",
  "Natasha Yar",
  "Wesley Crusher",
  "Katherine Pulaski",
  "Guinan",
  "Q",
  "Benjamin Sisko",
  "Kira Nerys",
  "Odo",
  "Julian Bashir",
  "Jadzia Dax",
  "Ezri Dax",
  "Miles O'Brien",
  "Quark",
  "Rom",
  "Nog",
  "Garak",
  "Dukat",
  "Weyoun",
  "Damar",
  "Martok",
  "Gowron",
  "Kathryn Janeway",
  "Chakotay",
  "Tuvok",
  "Tom Paris",
  "B'Elanna Torres",
  "Harry Kim",
  "Seven of Nine",
  "The Doctor",
  "Neelix",
  "Kes",
  "Jonathan Archer",
  "T'Pol",
  "Charles Tucker III",
  "Malcolm Reed",
  "Travis Mayweather",
  "Hoshi Sato",
  "Phlox",
  "Michael Burnham",
  "Saru",
  "Paul Stamets",
  "Sylvia Tilly",
  "Hugh Culber",
  "Christopher Pike",
  "Una Chin-Riley",
  "La'an Noonien-Singh",
  "Beckett Mariner",
  "Brad Boimler",
  "D'Vana Tendi",
  "Sam Rutherford",
  "Carol Freeman"
];

// Process important characters - use exact name matching only
const importantChars = characters.filter(char =>
  importantCharacters.includes(char.name)
);

// Add an "important" flag to these characters
importantChars.forEach(char => {
  char.important = true;
});

// Log the results
console.log(`Found ${importantChars.length} important characters with exact name matches`);

console.log(`Found ${importantChars.length} important characters to prioritize`);
console.log(`Flagged ${characters.filter(char => char.important).length} characters as important`);

// Process all characters, but with rate limiting
let downloaded = 0;
const BATCH_SIZE = 100;  // Process in batches
const DELAY_BETWEEN_REQUESTS = 100;  // ms between requests
const MAX_CHARACTERS = 7571;  // Safety limit

// Mark important characters and primary actors
for (const char of characters) {
  // Mark important characters
  if (importantCharacters.includes(char.name)) {
    char.important = true;
  }
  // Mark primary actors
  if (primaryActors.includes(char.name)) {
    char.keep = true;
  }
}

const withKeep = characters.filter(char => char.keep === true);
const withImportant = characters.filter(char => char.important === true);
console.log(`Marked ${withKeep.length} characters as primary actors (keep=true)`);
console.log(`Marked ${withImportant.length} characters as important`);

// Save to file
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(characters, null, 2));

console.log(`Wrote ${characters.length} characters to ${output}`);
console.timeEnd('harvest');