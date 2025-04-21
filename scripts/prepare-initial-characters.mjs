#!/usr/bin/env node

/**
 * This script prepares the initial-characters.json file containing
 * only the first 48 characters for build-time use.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const charactersLocalJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters-local.json');
const initialCharactersJsonPath = path.join(__dirname, '..', 'src', 'data', 'initial-characters.json');

async function main() {
  try {
    console.log('Preparing initial characters data...');
    
    // Read the full characters data
    console.log('Reading characters-local.json...');
    const charactersData = await fs.readFile(charactersLocalJsonPath, 'utf8');
    const characters = JSON.parse(charactersData);
    
    // Take only the first 48 characters
    const initialCharacters = characters.slice(0, 48);
    console.log(`Selected ${initialCharacters.length} initial characters`);
    
    // Write to initial-characters.json
    console.log('Writing initial-characters.json...');
    await fs.writeFile(
      initialCharactersJsonPath,
      JSON.stringify(initialCharacters, null, 2)
    );
    
    console.log('Successfully created initial-characters.json');
  } catch (error) {
    console.error('Error preparing initial characters:', error);
    process.exit(1);
  }
}

main();