#!/usr/bin/env node

/**
 * This script specifically fixes the Spock entries in the character data
 * by finding the most complete Spock record and setting its "keep" flag to true.
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

async function fixSpockEntries() {
  try {
    console.log('Reading characters.json...');
    const charactersData = await fs.readFile(charactersJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    console.log(`Read ${characters.length} characters from characters.json`);
    
    // Find all Spock entries
    const spockEntries = characters.filter(c => c.name === 'Spock');
    console.log(`Found ${spockEntries.length} entries with exact name 'Spock'`);
    
    if (spockEntries.length > 0) {
      // Find the most complete Spock record
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
      
      // Set keep: true for the best Spock entry
      console.log(`Setting keep: true for Spock entry with UID ${bestSpock.uid} (score: ${maxScore})`);
      
      // Find the index of the best Spock in the characters array
      const bestSpockIndex = characters.findIndex(c => c.uid === bestSpock.uid);
      if (bestSpockIndex !== -1) {
        characters[bestSpockIndex].keep = true;
        
        // Set keep: false for all other Spock entries
        for (const spock of spockEntries) {
          if (spock.uid !== bestSpock.uid) {
            const index = characters.findIndex(c => c.uid === spock.uid);
            if (index !== -1) {
              characters[index].keep = false;
            }
          }
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
        
        console.log('Successfully updated Spock entries!');
      } else {
        console.error(`Could not find best Spock entry in characters array!`);
      }
    } else {
      console.log('No Spock entries found!');
    }
  } catch (error) {
    console.error('Error fixing Spock entries:', error);
    process.exit(1);
  }
}

// Run the function
fixSpockEntries();