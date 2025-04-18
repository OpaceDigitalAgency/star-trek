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

// Helper function to identify potential character duplicates
function findPotentialDuplicates(characters) {
  // Map to store character names and their corresponding entries
  const characterMap = new Map();
  const actorMap = new Map();
  
  // Populate the maps
  for (const character of characters) {
    const name = character.name;
    
    if (!name) continue;
    
    // Check if it's likely an actor name
    if (isActorName(name)) {
      if (!actorMap.has(name)) {
        actorMap.set(name, []);
      }
      actorMap.get(name).push(character);
    } else {
      // It's a character name
      if (!characterMap.has(name)) {
        characterMap.set(name, []);
      }
      characterMap.get(name).push(character);
    }
  }
  
  // Find duplicates (entries with more than one character)
  const duplicates = new Map();
  
  // Check actor duplicates
  for (const [name, entries] of actorMap.entries()) {
    if (entries.length > 1) {
      duplicates.set(name, entries);
    }
  }
  
  // Check character duplicates that might be the same actor
  for (const [name, entries] of characterMap.entries()) {
    if (entries.length > 1) {
      // Additional logic could be added here to identify if these are truly duplicates
      // For now, we'll focus on the actor duplicates
    }
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
    
    // First, mark all characters as "keep: false" by default
    for (const character of characters) {
      character.keep = false;
    }
    
    // Process each set of duplicates - mark the most complete as "keep: true"
    let keepCount = 0;
    
    // For duplicate sets, find the most complete record
    for (const [name, entries] of duplicates.entries()) {
      console.log(`Processing duplicates for: ${name} (${entries.length} entries)`);
      
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
    
    // Now mark all non-duplicate characters as "keep: true" as well
    let uniqueCount = 0;
    for (const character of characters) {
      // If character doesn't have a keep flag yet (not part of a duplicate set)
      if (character.keep !== true) {
        character.keep = true;
        uniqueCount++;
      }
    }
    
    console.log(`Added "keep" flag to ${keepCount} records from duplicate sets`);
    console.log(`Added "keep" flag to ${uniqueCount} unique records`);
    console.log(`Total records marked as "keep": ${keepCount + uniqueCount}`);
    
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
    
    console.log('Successfully updated character data with "keep" flags!');
  } catch (error) {
    console.error('Error handling duplicate actors:', error);
    process.exit(1);
  }
}

// Run the function
handleDuplicateActors();