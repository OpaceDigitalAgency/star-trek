#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define path to characters.json
const charactersJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters.json');

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

async function checkSpockEntries() {
  try {
    console.log('Reading characters.json...');
    const charactersData = await fs.readFile(charactersJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    console.log(`Read ${characters.length} characters from characters.json`);
    
    // Find all Spock entries
    const spockEntries = characters.filter(c => c.name === 'Spock');
    console.log(`\nFound ${spockEntries.length} entries with exact name 'Spock'`);
    
    // Print details for each Spock entry
    spockEntries.forEach((spock, i) => {
      console.log(`\nSpock ${i+1}:`);
      console.log(`  UID: ${spock.uid}`);
      console.log(`  keep: ${spock.keep}`);
      console.log(`  score: ${scoreCharacterCompleteness(spock)}`);
      console.log(`  gender: ${spock.gender}`);
      console.log(`  yearOfBirth: ${spock.yearOfBirth}`);
      console.log(`  placeOfBirth: ${spock.placeOfBirth}`);
      console.log(`  species: ${JSON.stringify(spock.species)}`);
      console.log(`  wikiImage: ${spock.wikiImage ? 'Yes (has image)' : 'No'}`);
    });
    
    // Find the best Spock entry
    if (spockEntries.length > 0) {
      let bestSpock = spockEntries[0];
      let maxScore = scoreCharacterCompleteness(bestSpock);
      
      for (let i = 1; i < spockEntries.length; i++) {
        const score = scoreCharacterCompleteness(spockEntries[i]);
        if (score > maxScore) {
          maxScore = score;
          bestSpock = spockEntries[i];
        }
      }
      
      console.log(`\nBest Spock entry:`);
      console.log(`  UID: ${bestSpock.uid}`);
      console.log(`  score: ${maxScore}`);
    }
    
    // Count how many entries have keep: true
    const keepCount = characters.filter(c => c.keep === true).length;
    console.log(`\nTotal characters with keep: true: ${keepCount}`);
    
  } catch (error) {
    console.error('Error checking Spock entries:', error);
    process.exit(1);
  }
}

// Run the function
checkSpockEntries();