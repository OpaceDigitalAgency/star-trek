#!/usr/bin/env node

/**
 * This script copies the characters-local.json file (with local image paths)
 * to characters.json, ensuring the application uses the cached local images
 * instead of trying to proxy them through Netlify functions.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const charactersLocalJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters-local.json');
const charactersJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters.json');
const netlifyFunctionsCharactersJsonPath = path.join(__dirname, '..', 'netlify', 'functions', 'characters.json');

async function updateCharactersJson() {
  try {
    console.log('Checking if characters-local.json exists...');
    
    // Check if characters-local.json exists
    try {
      await fs.access(charactersLocalJsonPath);
    } catch (error) {
      console.error('characters-local.json does not exist. Run cache-character-images.mjs first.');
      process.exit(1);
    }
    
    // Read the characters-local.json file
    console.log('Reading characters-local.json...');
    const charactersLocalData = await fs.readFile(charactersLocalJsonPath, 'utf8');
    const charactersLocal = JSON.parse(charactersLocalData);
    
    console.log(`Read ${charactersLocal.length} characters with local image paths.`);
    
    // Write to characters.json
    console.log('Writing to characters.json...');
    await fs.writeFile(charactersJsonPath, JSON.stringify(charactersLocal, null, 2));
    
    // Also update the Netlify functions version if it exists
    try {
      await fs.access(netlifyFunctionsCharactersJsonPath);
      console.log('Updating Netlify functions characters.json...');
      await fs.writeFile(netlifyFunctionsCharactersJsonPath, JSON.stringify(charactersLocal, null, 2));
    } catch (error) {
      console.log('Netlify functions characters.json not found, skipping update.');
    }
    
    console.log('Successfully updated characters.json with local image paths!');
  } catch (error) {
    console.error('Error updating characters.json:', error);
    process.exit(1);
  }
}

// Run the function
updateCharactersJson();