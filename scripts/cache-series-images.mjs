#!/usr/bin/env node

/**
 * This script downloads and caches images for Star Trek series.
 * It reads the series data from src/data/series.json, downloads images from Memory Alpha,
 * and saves them to public/images/series-cache.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createHash } from 'crypto';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const seriesJsonPath = path.join(__dirname, '..', 'src', 'data', 'series.json');
const seriesImageCachePath = path.join(__dirname, '..', 'public', 'images', 'series-cache');

// Helper function to generate a filename from a URL
function generateFilename(url, uid) {
  // Extract file extension from URL
  const extension = path.extname(url).split('?')[0] || '.jpg';
  
  // Use UID if available, otherwise hash the URL
  if (uid) {
    return `${uid}${extension}`;
  } else {
    const hash = createHash('md5').update(url).digest('hex');
    return `${hash}${extension}`;
  }
}

// Helper function to download an image
async function downloadImage(url, filepath) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });
    
    await fs.writeFile(filepath, response.data);
    return true;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    return false;
  }
}

async function cacheSeriesImages() {
  try {
    console.log('Reading series data from src/data/series.json...');
    
    // Read the series data
    const seriesData = await fs.readFile(seriesJsonPath, 'utf8');
    const series = JSON.parse(seriesData);
    
    console.log(`Found ${series.length} series entries.`);
    
    // Create the series-cache directory if it doesn't exist
    try {
      await fs.mkdir(seriesImageCachePath, { recursive: true });
    } catch (error) {
      console.error('Error creating series-cache directory:', error);
    }
    
    // Download and cache images
    let successCount = 0;
    let failCount = 0;
    
    for (const seriesEntry of series) {
      // Skip if no image URL
      if (!seriesEntry.wikiImage) {
        console.log(`No image URL for ${seriesEntry.title}, skipping.`);
        continue;
      }
      
      // Generate filename
      const filename = generateFilename(seriesEntry.wikiImage, seriesEntry.uid);
      const filepath = path.join(seriesImageCachePath, filename);
      
      console.log(`Downloading image for ${seriesEntry.title}...`);
      
      // Download the image
      const success = await downloadImage(seriesEntry.wikiImage, filepath);
      
      if (success) {
        // Update the series entry with the local path
        seriesEntry.wikiImage = `/images/series-cache/${filename}`;
        successCount++;
        console.log(`Successfully cached image for ${seriesEntry.title}.`);
      } else {
        failCount++;
        console.log(`Failed to cache image for ${seriesEntry.title}.`);
      }
    }
    
    // Write the updated series data back to the file
    await fs.writeFile(seriesJsonPath, JSON.stringify(series, null, 2));
    
    console.log(`\nImage caching complete!`);
    console.log(`Successfully cached ${successCount} images.`);
    console.log(`Failed to cache ${failCount} images.`);
    
  } catch (error) {
    console.error('Error caching series images:', error);
  }
}

// Run the script
cacheSeriesImages();