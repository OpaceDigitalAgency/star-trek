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
  "Jean-Luc Picard",
  "Spock",
  "Data",
  "Benjamin Sisko",
  "Kathryn Janeway",
  "Worf",
  "Leonard McCoy",
  "William Riker",
  "Geordi La Forge",
  "Beverly Crusher",
  "Deanna Troi",
  "Seven of Nine",
  "Chakotay",
  "B'Elanna Torres",
  "The Doctor",
  "Tuvok",
  "Kira Nerys",
  "Odo",
  "Julian Bashir",
  "Jadzia Dax",
  "Miles O'Brien",
  "Quark",
  "Garak",
  "Scotty",
  "Uhura",
  "Sulu",
  "Chekov",
  "Christopher Pike",
  "Michael Burnham",
  "Saru",
  "Paul Stamets",
  "Sylvia Tilly",
  "Brent",
  "Decius",
  "DeSalle",
  "Galloway",
  "Garison",
  "Guardian of Forever",
  "Hadley",
  "Hansen (Lieutenant)",
  "Harrison",
  "Kang",
  "Kelowitz",
  "Koloth",
  "Kor",
  "Korax",
  "Kyle",
  "Landru (machine)",
  "Leslie",
  "Joseph M&#39;Benga",
  "Sarek",
  "Stonn",
  "T&#39;Pau",
  "T&#39;Pring",
  "Una Chin-Riley",
  "Vina",
  "White Rabbit",
  "Robert April",
  "Arex",
  "Gabler",
  "M&#39;Ress",
  "B-4",
  "Borg Queen",
  "Cartwright",
  "Daniels (Lieutenant)",
  "Hayes (Male Admiral)",
  "Hendorff (alternate reality)",
  "Keenser",
  "Lojur",
  "Saavik",
  "Sybok",
  "Torg",
  "Argyle",
  "Arridor",
  "B&#39;Etor",
  "Bok",
  "Boothby",
  "Duras, son of Ja&#39;rod",
  "Garvey",
  "Gates",
  "Evek",
  "Richard Poe",
  "Giusti",
  "Gowron",
  "Guinan",
  "Herbert",
  "Homn",
  "Hugh",
  "Jae",
  "Kalita",
  "K&#39;Ehleyr",
  "Kellogg",
  "Cameron",
  "Kol (Ferengi)",
  "Kurn",
  "Ro Laren",
  "Lore",
  "Lursa",
  "Martinez",
  "Minuet",
  "Mot",
  "Nakamura",
  "Narik",
  "Q",
  "Russell",
  "Elizabeth Shelby",
  "Sela",
  "Spot",
  "Tallera",
  "Toral, son of Duras",
  "Tomalak",
  "Vash",
  "Youngblood",
  "Amaros",
  "Bareil Antos",
  "Benteen",
  "Broca",
  "Broik",
  "Brunt",
  "Chekote",
  "Damar",
  "Dukat",
  "Female Changeling",
  "Furel",
  "Gor",
  "Grilka",
  "Jaresh-Inyo",
  "Ishka",
  "Ikat&#39;ika",
  "Jabara",
  "Jaro Essa",
  "Keevan",
  "Kira Taban",
  "Kobb",
  "Lauren",
  "Leck",
  "Leeta",
  "Leyton",
  "Li Nalas",
  "Lupaza",
  "Maihar&#39;du",
  "Martok",
  "Mila",
  "Mora Pol",
  "Morn",
  "M&#39;Pella",
  "Nog",
  "Opaka",
  "Patrick",
  "Pran",
  "Rionoj",
  "Rom",
  "Rusot",
  "Sakonna",
  "Seskal",
  "Shakaar Edon",
  "Luther Sloan",
  "Solbor",
  "Velal",
  "Vin",
  "Weyoun 4",
  "Winn Adami",
  "Zek",
  "Tora Ziyal",
  "Ashmore",
  "Ayala",
  "Azan",
  "Braxton",
  "Culhane",
  "Culluh",
  "Hogan",
  "Icheb",
  "Idrin",
  "Loran",
  "Mezoti",
  "Rebi",
  "Seamus",
  "Seska",
  "Surat",
  "Templeton",
  "Valek",
  "Vorik",
  "Alex",
  "Degra",
  "Dolim",
  "Humanoid Figure",
  "Jannar",
  "Kelby",
  "Koss",
  "Malik",
  "Persis",
  "Porthos",
  "Rossi",
  "Silik",
  "Soval",
  "Tanner",
  "Thalen",
  "V&#39;Las",
  "Vosk",
  "Montgomery Scott",
  "Hikaru Sulu",
  "Pavel Chekov",
  "Nyota Uhura",
  "Christine Chapel",
  "Janice Rand",
  "Patrick Stewart",
  "Jonathan Frakes",
  "Brent Spiner",
  "LeVar Burton",
  "Michael Dorn",
  "Gates McFadden",
  "Marina Sirtis",
  "Denise Crosby",
  "Natasha Yar",
  "Wil Wheaton",
  "Wesley Crusher",
  "Diana Muldaur",
  "Katherine Pulaski",
  "TNG Season 2",
  "Avery Brooks",
  "Nana Visitor",
  "Terry Farrell",
  "Alexander Siddig",
  "Colm Meaney",
  "Miles O&#39;Brien",
  "Nicole de Boer",
  "Ezri Dax",
  "Armin Shimerman",
  "Cirroc Lofton",
  "Jake Sisko",
  "Kate Mulgrew",
  "Robert Beltran",
  "Tim Russ",
  "Robert Duncan McNeill",
  "Tom Paris",
  "Roxann Dawson",
  "B&#39;Elanna Torres",
  "Garrett Wang",
  "Harry Kim",
  "Jeri Ryan",
  "Robert Picardo",
  "Ethan Phillips",
  "Neelix",
  "Jennifer Lien",
  "Kes",
  "Scott Bakula",
  "Jonathan Archer",
  "Jolene Blalock",
  "T&#39;Pol",
  "Connor Trinneer",
  "Charles Tucker III",
  "Dominic Keating",
  "Malcolm Reed",
  "Anthony Montgomery",
  "Travis Mayweather",
  "Linda Park",
  "Hoshi Sato",
  "John Billingsley",
  "Phlox",
  "John Cho",
  "Hikaru Sulu (alternate reality)",
  "Simon Pegg",
  "Montgomery Scott (alternate reality)",
  "Chris Pine",
  "Zachary Quinto",
  "Spock (alternate reality)",
  "Zoë Saldana",
  "Nyota Uhura (alternate reality)",
  "Karl Urban",
  "Anton Yelchin",
  "Pavel Chekov (alternate reality)",
  "Sonequa Martin-Green",
  "Doug Jones",
  "Shazad Latif",
  "Ash Tyler (Klingon)",
  "Anthony Rapp",
  "Mary Wiseman",
  "Wilson Cruz",
  "Hugh Culber",
  "Rachael Ancheril",
  "D. Nhan",
  "Tig Notaro",
  "Jett Reno",
  "Jason Isaacs",
  "Gabriel Lorca (mirror)",
  "Anson Mount",
  "David Ajala",
  "Cleveland Booker",
  "Blu del Barrio",
  "Adira Tal",
  "Callum Keith Rennie",
  "Rayner",
  "Michelle Yeoh",
  "Philippa Georgiou (mirror)",
  "Alison Pill",
  "Agnes Jurati",
  "Isa Briones",
  "Soji Asha",
  "Kore Soong",
  "Evan Evagora",
  "Elnor",
  "Michelle Hurd",
  "Santiago Cabrera",
  "Cristóbal Rios",
  "Harry Treadaway",
  "Narek",
  "Orla Brady",
  "Laris",
  "Tallinn",
  "Adam Soong",
  "Ed Speleers",
  "Jack Crusher",
  "Tawny Newsome",
  "Beckett Mariner",
  "Jack Quaid",
  "Brad Boimler",
  "Noël Wells",
  "D&#39;Vana Tendi",
  "Eugene Cordero",
  "Sam Rutherford",
  "Dawnn Lewis",
  "Carol Freeman",
  "Jerry O&#39;Connell",
  "Jack Ransom",
  "Fred Tatasciore",
  "Shaxs",
  "Gillian Vigman",
  "T&#39;Ana",
  "Brett Gray",
  "Dal R&#39;El",
  "Ella Purnell",
  "Gwyndala",
  "Jason Mantzoukas",
  "Jankom Pog",
  "Angus Imrie",
  "Zero",
  "Rylee Alazraqui",
  "Rok-Tahk",
  "Dee Bradley Baker",
  "Murf",
  "Jimmi Simpson",
  "Drednok",
  "John Noble",
  "Ilthuran",
  "Kathryn Janeway (hologram)",
  "Jameela Jamil",
  "Asencia",
  "Ethan Peck",
  "Jess Bush",
  "Christina Chong",
  "La&#39;an Noonien-Singh",
  "Celia Rose Gooding",
  "Melissa Navia",
  "Erica Ortegas",
  "Babs Olusanmokun",
  "Bruce Horak",
  "Hemmer",
  "Rebecca Romijn",
  "Character crossover appearances",
  "Cast members who directed",
  "Regular cast characters by rank",
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
  "SNW regular cast non-appearances",
  "Category:Production lists"
];

// First process important characters
const importantChars = characters.filter(char =>
  importantCharacters.some(name => char.name.includes(name))
);

// Add an "important" flag to these characters
importantChars.forEach(char => {
  char.important = true;
});

// Also flag any character whose name exactly matches an important character
characters.forEach(char => {
  if (importantCharacters.includes(char.name)) {
    char.important = true;
  }
});

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