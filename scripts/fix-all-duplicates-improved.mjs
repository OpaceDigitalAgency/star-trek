#!/usr/bin/env node

/**
 * This script identifies and fixes all duplicate character entries in the data,
 * with special handling for important characters like Spock and Worf.
 * It marks the most complete record for each character with "keep: true".
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
  
  // Give extra weight to image data
  if (character.wikiImage) {
    score += 10; // Significant boost for having an image
  }
  
  return score;
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
  
  // Special case for important characters - manually group all entries
  const importantCharacters = ['Spock', 'Worf', 'Data', 'Jean-Luc Picard', 'James T. Kirk'];
  
  for (const charName of importantCharacters) {
    const charEntries = [];
    const normalizedName = normalizeCharacterName(charName);
    
    for (const character of characters) {
      if (!character.name) continue;
      
      // Check exact match
      if (character.name === charName) {
        charEntries.push(character);
        continue;
      }
      
      // Check normalized match
      if (normalizeCharacterName(character.name) === normalizedName) {
        charEntries.push(character);
      }
    }
    
    if (charEntries.length > 1) {
      duplicates.set(`${charName} (all variations)`, charEntries);
    }
  }
  
  return duplicates;
}

async function fixAllDuplicates() {
  try {
    console.log('Reading characters.json...');
    const charactersData = await fs.readFile(charactersJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    console.log(`Read ${characters.length} characters from characters.json`);
    
    // Find potential duplicates
    const duplicates = findPotentialDuplicates(characters);
    console.log(`Found ${duplicates.size} potential duplicate character sets`);
    
    // Create a Set to track all UIDs that are part of duplicate sets
    const duplicateUIDs = new Set();
    
    // First, mark all characters as "keep: false" by default
    for (const character of characters) {
      character.keep = false;
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
    
    // Final check for important characters
    for (const charName of ['Spock', 'Worf']) {
      const charEntries = characters.filter(c => c.name === charName);
      console.log(`\nFinal check for ${charName} entries:`);
      console.log(`Found ${charEntries.length} entries with exact name '${charName}'`);
      charEntries.forEach((char, i) => {
        console.log(`${charName} ${i+1}: UID=${char.uid}, keep=${char.keep}, score=${scoreCharacterCompleteness(char)}`);
      });
    }
    
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
    console.error('Error fixing duplicate characters:', error);
    process.exit(1);
  }
}

// Run the function
fixAllDuplicates();