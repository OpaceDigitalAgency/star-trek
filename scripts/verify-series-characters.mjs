#!/usr/bin/env node

/**
 * This script verifies that the series-characters.json file exists and has the expected structure.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the path to the series-characters.json file
const seriesCharactersPath = path.join(__dirname, '..', 'netlify', 'functions', 'series-characters.json');

async function verifySeriesCharacters() {
  try {
    console.log('Verifying series-characters.json file...');
    
    // Check if the file exists
    try {
      await fs.access(seriesCharactersPath);
      console.log('✅ series-characters.json file exists');
    } catch (error) {
      console.error('❌ series-characters.json file does not exist');
      return;
    }
    
    // Read the file
    const data = await fs.readFile(seriesCharactersPath, 'utf8');
    const seriesCharacters = JSON.parse(data);
    
    // Check if the file has the expected structure
    if (typeof seriesCharacters !== 'object') {
      console.error('❌ series-characters.json is not an object');
      return;
    }
    
    // Check if the file has data for each series
    const seriesCount = Object.keys(seriesCharacters).length;
    console.log(`✅ Found data for ${seriesCount} series`);
    
    // Check each series
    for (const [seriesSlug, characters] of Object.entries(seriesCharacters)) {
      console.log(`\nSeries: ${seriesSlug}`);
      console.log(`- Characters: ${characters.length}`);
      
      // Check the first character
      if (characters.length > 0) {
        const firstCharacter = characters[0];
        console.log('- First character:');
        console.log(`  - Name: ${firstCharacter.name}`);
        console.log(`  - Performer: ${firstCharacter.performer}`);
        console.log(`  - Image: ${firstCharacter.image ? '✅ Present' : '❌ Missing'}`);
        console.log(`  - URL: ${firstCharacter.url ? '✅ Present' : '❌ Missing'}`);
      }
    }
    
    console.log('\n✅ Verification complete!');
  } catch (error) {
    console.error('Error verifying series-characters.json:', error);
  }
}

// Run the verification
verifySeriesCharacters();