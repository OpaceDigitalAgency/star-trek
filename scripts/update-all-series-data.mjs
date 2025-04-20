#!/usr/bin/env node

/**
 * This script updates all series data by running the series cache and episodes cache scripts in sequence.
 * It ensures that we have a complete and up-to-date dataset for all Star Trek series.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Promisify exec
const execPromise = promisify(exec);

// Function to run a script and log its output
async function runScript(scriptPath) {
  console.log(`Running ${path.basename(scriptPath)}...`);
  try {
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    return true;
  } catch (error) {
    console.error(`Error running ${path.basename(scriptPath)}:`, error.message);
    return false;
  }
}

// Main function to update all series data
async function updateAllSeriesData() {
  console.log('Starting update of all series data...');
  
  // Step 1: Build the series cache
  const seriesCacheScript = path.join(__dirname, 'build-series-cache.mjs');
  const seriesCacheSuccess = await runScript(seriesCacheScript);
  
  if (!seriesCacheSuccess) {
    console.error('Failed to build series cache. Aborting.');
    process.exit(1);
  }
  
  // Step 2: Cache the series images
  const seriesImagesScript = path.join(__dirname, 'cache-series-images.mjs');
  const seriesImagesSuccess = await runScript(seriesImagesScript);
  
  if (!seriesImagesSuccess) {
    console.error('Failed to cache series images.');
    process.exit(1);
  }
  
  // Step 3: Build the series episodes cache
  const seriesEpisodesScript = path.join(__dirname, 'build-series-episodes.mjs');
  const seriesEpisodesSuccess = await runScript(seriesEpisodesScript);
  
  if (!seriesEpisodesSuccess) {
    console.error('Failed to build series episodes cache.');
    process.exit(1);
  }
  
  // Step 4: Cache the character images
  const characterImagesScript = path.join(__dirname, 'cache-character-images.mjs');
  const characterImagesSuccess = await runScript(characterImagesScript);
  
  if (!characterImagesSuccess) {
    console.error('Failed to cache character images.');
    process.exit(1);
  }
  
  // Step 5: Update Netlify functions characters.json with characters-local.json data
  const updateNetlifyCharactersScript = path.join(__dirname, 'update-netlify-characters.mjs');
  const updateNetlifyCharactersSuccess = await runScript(updateNetlifyCharactersScript);
  
  if (!updateNetlifyCharactersSuccess) {
    console.error('Failed to update Netlify functions characters.json.');
    process.exit(1);
  }
  
  // Step 6: Build the series characters cache
  const seriesCharactersScript = path.join(__dirname, 'build-series-characters.mjs');
  const seriesCharactersSuccess = await runScript(seriesCharactersScript);
  
  if (!seriesCharactersSuccess) {
    console.error('Failed to build series characters cache.');
    process.exit(1);
  }
  
  console.log('All series data updated successfully!');
}

// Run the script
updateAllSeriesData().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});