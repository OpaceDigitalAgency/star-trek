#!/usr/bin/env node

/**
 * This script converts WebP images in the character-cache directory to JPG format.
 * It uses the sharp library to convert the images.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const characterCachePath = path.join(__dirname, '..', 'public', 'images', 'character-cache');

async function main() {
  try {
    console.log('Reading character-cache directory...');
    const files = await fs.readdir(characterCachePath);
    console.log(`Found ${files.length} files.`);
    
    let convertedCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.jpg')) continue;
      
      const filePath = path.join(characterCachePath, file);
      
      try {
        // Check if the file is a WebP image
        const fileBuffer = await fs.readFile(filePath);
        const metadata = await sharp(fileBuffer).metadata();
        
        if (metadata.format === 'webp') {
          console.log(`Converting ${file} from WebP to JPG...`);
          
          // Convert WebP to JPG
          const jpgBuffer = await sharp(fileBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();
          
          // Write the JPG file
          await fs.writeFile(filePath, jpgBuffer);
          
          convertedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`Conversion complete. Converted ${convertedCount} files. Errors: ${errorCount}.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

