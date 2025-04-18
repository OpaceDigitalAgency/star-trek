#!/usr/bin/env node

/**
 * This script identifies duplicate actors in the character data,
 * finds the most complete record for each set of duplicates,
 * and adds a "keep" flag to these records.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const charactersJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters.json');
const charactersLocalJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters-local.json');
const netlifyCharactersJsonPath = path.join(__dirname, '..', 'netlify', 'functions', 'characters.json');

// Helper function to score a character's completeness
function scoreCharacterCompleteness(character) {
  let score = 0;
  
  // Base score is the number of populated fields
  for (const key in character) {
    if (character[key] !== null && character[key] !== undefined) {
      // For arrays, check if they have content
      if (Array.isArray(character[key])) {
        if (character[key].length > 0) score += 1;
      } else {
        score += 1;
      }
    }
  }
  
  // Give extra weight to important biographical fields
  const importantFields = ['gender', 'yearOfBirth', 'yearOfDeath', 'height', 'weight', 'status'];
  for (const field of importantFields) {
    if (character[field] !== null && character[field] !== undefined) {
      score += 5; // Give significant extra points for these fields
    }
  }
  
  // Give extra weight to species information
  if (Array.isArray(character.characterSpecies) && character.characterSpecies.length > 0) {
    score += 3;
  } else if (Array.isArray(character.species) && character.species.length > 0) {
    score += 3;
  }
  
  return score;
}

// Helper function to identify potential actor names
function isActorName(name) {
  // List of known actor names from the importantCharacters list
  const knownActors = [
    "Patrick Stewart", "Jonathan Frakes", "Brent Spiner", "LeVar Burton", 
    "Michael Dorn", "Gates McFadden", "Marina Sirtis", "Denise Crosby",
    "Wil Wheaton", "Diana Muldaur", "Avery Brooks", "Nana Visitor",
    "Terry Farrell", "Alexander Siddig", "Colm Meaney", "Nicole de Boer",
    "Armin Shimerman", "Cirroc Lofton", "Kate Mulgrew", "Robert Beltran",
    "Tim Russ", "Robert Duncan McNeill", "Roxann Dawson", "Garrett Wang",
    "Jeri Ryan", "Robert Picardo", "Ethan Phillips", "Jennifer Lien",
    "Scott Bakula", "Jolene Blalock", "Connor Trinneer", "Dominic Keating",
    "Anthony Montgomery", "Linda Park", "John Billingsley", "John Cho",
    "Simon Pegg", "Chris Pine", "Zachary Quinto", "Zoë Saldana",
    "Karl Urban", "Anton Yelchin", "Sonequa Martin-Green", "Doug Jones",
    "Shazad Latif", "Anthony Rapp", "Mary Wiseman", "Wilson Cruz",
    "Rachael Ancheril", "Tig Notaro", "Jason Isaacs", "Anson Mount",
    "David Ajala", "Blu del Barrio", "Callum Keith Rennie", "Michelle Yeoh",
    "Alison Pill", "Isa Briones", "Evan Evagora", "Michelle Hurd",
    "Santiago Cabrera", "Harry Treadaway", "Orla Brady", "Ed Speleers",
    "Tawny Newsome", "Jack Quaid", "Noël Wells", "Eugene Cordero",
    "Dawnn Lewis", "Jerry O'Connell", "Fred Tatasciore", "Gillian Vigman",
    "Brett Gray", "Ella Purnell", "Jason Mantzoukas", "Angus Imrie",
    "Rylee Alazraqui", "Dee Bradley Baker", "Jimmi Simpson", "John Noble",
    "Jameela Jamil", "Ethan Peck", "Jess Bush", "Christina Chong",
    "Celia Rose Gooding", "Melissa Navia", "Babs Olusanmokun", "Bruce Horak",
    "Rebecca Romijn"
  ];

  // Check if the name is in the known actors list
  if (knownActors.includes(name)) return true;

  // Check if the name has a space (first and last name)
  if (name.includes(' ')) {
    // Check if it doesn't have common character title prefixes
    const titles = ["Admiral", "Captain", "Commander", "Lieutenant", "Ensign", "Doctor", "Dr.", "Gul", "Legate", "Kai"];
    return !titles.some(title => name.startsWith(title + " "));
  }

  return false;
}

// Helper function to normalize character names for better matching
function normalizeCharacterName(name) {
  if (!name) return '';
  
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove common prefixes
  const prefixes = ["admiral", "captain", "commander", "lieutenant", "ensign", "doctor", "dr.", "gul", "legate", "kai", "mr.", "mrs.", "ms.", "professor", "prof."];
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix + " ")) {
      normalized = normalized.substring(prefix.length + 1);
    }
  }
  
  // Remove suffixes like "Jr." or "III"
  normalized = normalized.replace(/\s+(jr\.?|sr\.?|i{1,3}|iv|v)$/i, '');
  
  // Remove middle initials (like "James T. Kirk" -> "james kirk")
  normalized = normalized.replace(/\b[a-z]\.\s+/g, ' ');
  
  // Trim and remove extra spaces
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  return normalized;
}

// Helper function to identify potential character duplicates
function findPotentialDuplicates(characters) {
  // Map to store character names and their corresponding entries
  const characterMap = new Map();
  const normalizedCharacterMap = new Map(); // For normalized character names
  
  // Populate the maps
  for (const character of characters) {
    const name = character.name;
    
    if (!name) continue;
    
    // Store all characters by their exact name
    if (!characterMap.has(name)) {
      characterMap.set(name, []);
    }
    characterMap.get(name).push(character);
    
    // Also store with normalized name for fuzzy matching
    const normalizedName = normalizeCharacterName(name);
    if (normalizedName && normalizedName !== name.toLowerCase()) {
      if (!normalizedCharacterMap.has(normalizedName)) {
        normalizedCharacterMap.set(normalizedName, []);
      }
      normalizedCharacterMap.get(normalizedName).push(character);
    }
  }
  
  // Find duplicates (entries with more than one character)
  const duplicates = new Map();
  
  // Check exact name duplicates
  for (const [name, entries] of characterMap.entries()) {
    if (entries.length > 1) {
      duplicates.set(name, entries);
    }
  }
  
  // Check normalized character name duplicates
  for (const [normalizedName, entries] of normalizedCharacterMap.entries()) {
    if (entries.length > 1) {
      // For normalized names, use the normalized name as the key with a prefix
      // to avoid conflicts with exact name matches
      duplicates.set(`normalized:${normalizedName}`, entries);
    }
  }
  
  // Special case for Spock - manually group all Spock entries
  const spockEntries = [];
  for (const character of characters) {
    if (character.name && character.name.toLowerCase().includes('spock')) {
      spockEntries.push(character);
    }
  }
  
  if (spockEntries.length > 1) {
    duplicates.set('Spock (all variations)', spockEntries);
  }
  
  return duplicates;
}

async function handleDuplicateActors() {
  try {
    console.log('Reading characters.json...');
    const charactersData = await fs.readFile(charactersJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    console.log(`Read ${characters.length} characters from characters.json`);
    
    // Find potential duplicates
    const duplicates = findPotentialDuplicates(characters);
    console.log(`Found ${duplicates.size} potential duplicate actor sets`);
    
    // Create a Set to track all UIDs that are part of duplicate sets
    const duplicateUIDs = new Set();
    
    // First, mark all characters as "keep: false" by default
    for (const character of characters) {
      character.keep = false;
    }
    
    // Special handling for Spock - directly find and mark the best Spock entry
    const spockEntries = characters.filter(c => c.name === 'Spock');
    console.log(`Found ${spockEntries.length} entries with exact name 'Spock'`);
    
    if (spockEntries.length > 1) {
      // Find the most complete Spock entry
      let bestSpock = spockEntries[0];
      let maxScore = scoreCharacterCompleteness(bestSpock);
      
      for (let i = 1; i < spockEntries.length; i++) {
        const score = scoreCharacterCompleteness(spockEntries[i]);
        console.log(`Spock entry ${i+1} (${spockEntries[i].uid}) has score ${score}`);
        if (score > maxScore) {
          maxScore = score;
          bestSpock = spockEntries[i];
        }
      }
      
      // Mark the best Spock as keep: true
      bestSpock.keep = true;
      console.log(`Directly selected Spock entry with UID ${bestSpock.uid} as the most complete (score: ${maxScore})`);
      
      // Add all Spock UIDs to the duplicateUIDs set
      for (const spock of spockEntries) {
        if (spock.uid) {
          duplicateUIDs.add(spock.uid);
        }
      }
    }
    
    // Process each set of duplicates - mark the most complete as "keep: true"
    let keepCount = 0;
    
    // For duplicate sets, find the most complete record
    for (const [name, entries] of duplicates.entries()) {
      console.log(`Processing duplicates for: ${name} (${entries.length} entries)`);
      
      // Add all UIDs in this duplicate set to our tracking Set
      for (const entry of entries) {
        if (entry.uid) {
          duplicateUIDs.add(entry.uid);
        }
      }
      
      // Find the most complete record using our scoring system
      let mostComplete = entries[0];
      let maxScore = scoreCharacterCompleteness(mostComplete);
      
      for (let i = 1; i < entries.length; i++) {
        const score = scoreCharacterCompleteness(entries[i]);
        if (score > maxScore) {
          maxScore = score;
          mostComplete = entries[i];
        }
      }
      
      // Add the "keep" flag to the most complete record
      mostComplete.keep = true;
      keepCount++;
      
      // Log the result
      console.log(`  Selected entry with UID ${mostComplete.uid} as the most complete (score: ${maxScore})`);
    }
    
    // Now mark all non-duplicate characters as "keep: true"
    let uniqueCount = 0;
    for (const character of characters) {
      // If character is not part of any duplicate set
      if (character.uid && !duplicateUIDs.has(character.uid)) {
        character.keep = true;
        uniqueCount++;
      }
    }
    
    console.log(`Added "keep" flag to ${keepCount} records from duplicate sets`);
    console.log(`Added "keep" flag to ${uniqueCount} unique records`);
    console.log(`Total records marked as "keep": ${keepCount + uniqueCount}`);
    
    // Final check for Spock entries
    const finalSpockEntries = characters.filter(c => c.name === 'Spock');
    console.log(`\nFinal check for Spock entries:`);
    console.log(`Found ${finalSpockEntries.length} entries with exact name 'Spock'`);
    finalSpockEntries.forEach((spock, i) => {
      console.log(`Spock ${i+1}: UID=${spock.uid}, keep=${spock.keep}, score=${scoreCharacterCompleteness(spock)}`);
    });
    
    // Write the updated data back to the files
    console.log('Writing updated data to characters.json...');
    await fs.writeFile(charactersJsonPath, JSON.stringify(characters, null, 2));
    
    // Also update characters-local.json if it exists
    try {
      await fs.access(charactersLocalJsonPath);
      console.log('Writing updated data to characters-local.json...');
      await fs.writeFile(charactersLocalJsonPath, JSON.stringify(characters, null, 2));
    } catch (error) {
      console.log('characters-local.json not found, skipping update.');
    }
    
    // Also update the Netlify functions characters.json if it exists
    try {
      await fs.access(netlifyCharactersJsonPath);
      console.log('Writing updated data to netlify/functions/characters.json...');
      await fs.writeFile(netlifyCharactersJsonPath, JSON.stringify(characters, null, 2));
    } catch (error) {
      console.log('netlify/functions/characters.json not found, skipping update.');
    }
    
    console.log('Successfully updated character data with "keep" flags!');
  } catch (error) {
    console.error('Error handling duplicate actors:', error);
    process.exit(1);
  }
}

// Run the function
handleDuplicateActors();