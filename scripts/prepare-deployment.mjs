#!/usr/bin/env node

/**
 * This script prepares the project for deployment by:
 * 1. Ensuring characters.json is using local image paths
 * 2. Providing information about the deployment size
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
const characterCachePath = path.join(__dirname, '..', 'public', 'images', 'character-cache');

async function prepareDeployment() {
  try {
    console.log('Preparing for deployment...');
    
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
    console.log('Updating characters.json...');
    await fs.writeFile(charactersJsonPath, JSON.stringify(charactersLocal, null, 2));
    
    // Also update the Netlify functions version if it exists
    try {
      await fs.access(netlifyFunctionsCharactersJsonPath);
      console.log('Updating Netlify functions characters.json...');
      await fs.writeFile(netlifyFunctionsCharactersJsonPath, JSON.stringify(charactersLocal, null, 2));
    } catch (error) {
      console.log('Netlify functions characters.json not found, skipping update.');
    }
    
    // Calculate the size of the character-cache directory
    try {
      const files = await fs.readdir(characterCachePath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(characterCachePath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
      
      console.log(`Character cache contains ${files.length} images.`);
      console.log(`Total size: ${sizeInMB} MB (${sizeInGB} GB)`);
      console.log('Note: Netlify has a deployment size limit of 15GB per site.');
      
      if (parseFloat(sizeInGB) > 10) {
        console.warn('WARNING: The character cache is quite large. Consider using a separate image hosting service for production.');
      }
    } catch (error) {
      console.log('Could not calculate character cache size:', error.message);
    }
    
    console.log('Deployment preparation complete!');
    console.log('You can now deploy to Netlify with: netlify deploy');
  } catch (error) {
    console.error('Error preparing for deployment:', error);
    process.exit(1);
  }
}

// Run the function
prepareDeployment();