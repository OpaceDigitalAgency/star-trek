#!/usr/bin/env node

/**
 * This script specifically fixes the Worf entries in the character data
 * by finding the most complete Worf record and setting its "keep" flag to true.
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

async function fixWorfEntries() {
  try {
    console.log('Reading characters.json...');
    const charactersData = await fs.readFile(charactersJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    console.log(`Read ${characters.length} characters from characters.json`);
    
    // Find all Worf entries
    const worfEntries = characters.filter(c => c.name === 'Worf');
    console.log(`Found ${worfEntries.length} entries with exact name 'Worf'`);
    
    if (worfEntries.length > 0) {
      // Find the most complete Worf record
      let bestWorf = worfEntries[0];
      let maxScore = scoreCharacterCompleteness(bestWorf);
      
      for (let i = 1; i < worfEntries.length; i++) {
        const score = scoreCharacterCompleteness(worfEntries[i]);
        console.log(`Worf entry ${i+1} (${worfEntries[i].uid}) has score ${score}`);
        if (score > maxScore) {
          maxScore = score;
          bestWorf = worfEntries[i];
        }
      }
      
      // Set keep: true for the best Worf entry
      console.log(`Setting keep: true for Worf entry with UID ${bestWorf.uid} (score: ${maxScore})`);
      
      // Find the index of the best Worf in the characters array
      const bestWorfIndex = characters.findIndex(c => c.uid === bestWorf.uid);
      if (bestWorfIndex !== -1) {
        characters[bestWorfIndex].keep = true;
        
        // Set keep: false for all other Worf entries
        for (const worf of worfEntries) {
          if (worf.uid !== bestWorf.uid) {
            const index = characters.findIndex(c => c.uid === worf.uid);
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
        
        console.log('Successfully updated Worf entries!');
      } else {
        console.error(`Could not find best Worf entry in characters array!`);
      }
    } else {
      console.log('No Worf entries found!');
    }
  } catch (error) {
    console.error('Error fixing Worf entries:', error);
    process.exit(1);
  }
}

// Run the function
fixWorfEntries();