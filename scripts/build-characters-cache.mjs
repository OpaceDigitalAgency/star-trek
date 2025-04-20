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

// Enrich with Memory Alpha data for important characters
console.log('Enriching important characters with Memory Alpha data...');

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

// Process important characters first
for (const char of importantChars) {
  if (downloaded >= MAX_CHARACTERS) break;

  // Skip if already has wikiImage or wikiUrl
  if (char.wikiImage || char.wikiUrl) {
    downloaded++;
    continue;
  }

  console.log(`Processing important character: ${char.name}`);
  
  // Process character name for Memory Alpha lookup
  // 1. Expand abbreviated names (e.g. "J. Kirk" → "James T. Kirk")
  // 2. Remove titles (e.g. "Gul Dukat" → "Dukat", "Admiral Janeway" → "Janeway")
  let queryName = char.name.match(/^[A-Z]\./) ? char.fullName ?? char.name : char.name;
  
  // Remove common titles
  const titles = ["Admiral", "Captain", "Commander", "Lieutenant", "Ensign", "Doctor", "Dr.", "Gul", "Legate", "Kai"];
  for (const title of titles) {
    if (queryName.startsWith(title + " ")) {
      queryName = queryName.substring(title.length + 1);
      console.log(`Removed title from ${char.name} → ${queryName}`);
      break;
    }
  }
  
  try {
    const wiki = await stapiService.getMemoryAlphaContent(queryName);
    if (wiki?.image?.includes('placeholder') || wiki?.image?.endsWith('.svg')) {
      // keep searching, don't count towards budget
      console.log(`Skipping placeholder/SVG image for ${char.name}`);
    } else if (wiki?.image) {
      char.wikiImage = wiki.image;
      downloaded++;
      console.log(`Added image for ${char.name}: ${wiki.image}`);
    }
    
    if (wiki?.wikiUrl) {
      char.wikiUrl = wiki.wikiUrl;
      console.log(`Added wiki URL for ${char.name}: ${wiki.wikiUrl}`);
    }
  } catch (error) {
    console.error(`Error fetching wiki content for ${char.name}:`, error);
  }
}

// Process remaining characters
const remainingChars = characters.filter(char =>
  !importantChars.includes(char) && !char.wikiImage
);

// Shuffle the array to get a random selection
const shuffled = [...remainingChars].sort(() => 0.5 - Math.random());

// Process random selection of remaining characters
for (const char of shuffled) {
  if (downloaded >= MAX_CHARACTERS) break;

  // Process character name for Memory Alpha lookup
  // 1. Expand abbreviated names (e.g. "J. Kirk" → "James T. Kirk")
  // 2. Remove titles (e.g. "Gul Dukat" → "Dukat", "Admiral Janeway" → "Janeway")
  let queryName = char.name.match(/^[A-Z]\./) ? char.fullName ?? char.name : char.name;
  
  // Remove common titles
  const titles = ["Admiral", "Captain", "Commander", "Lieutenant", "Ensign", "Doctor", "Dr.", "Gul", "Legate", "Kai"];
  for (const title of titles) {
    if (queryName.startsWith(title + " ")) {
      queryName = queryName.substring(title.length + 1);
      console.log(`Removed title from ${char.name} → ${queryName}`);
      break;
    }
  }

  try {
    const wiki = await stapiService.getMemoryAlphaContent(queryName);
    if (wiki?.image?.includes('placeholder') || wiki?.image?.endsWith('.svg')) {
      // keep searching, don't count towards budget
    } else if (wiki?.image) {
      char.wikiImage = wiki.image;
      downloaded++;
    }
    
    if (wiki?.wikiUrl) {
      char.wikiUrl = wiki.wikiUrl;
    }
  } catch (error) {
    console.error(`Error fetching wiki content for ${queryName}:`, error);
  }
  
  // Log progress every 50 characters
  if (downloaded % 50 === 0 && downloaded > 0) {
    console.log(`Processed ${downloaded} characters with Memory Alpha data`);
  }
}

console.log(`Enriched ${downloaded} characters with Memory Alpha data`);

// Save to file
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(characters, null, 2));

console.log(`Wrote ${characters.length} characters to ${output}`);
console.timeEnd('harvest');