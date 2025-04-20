#!/usr/bin/env node

/**
 * This script improves character image matching by using the same logic
 * as the series detail pages. It looks for character images in the
 * character-cache directory and tries to match them with characters
 * using exact, loose, and fuzzy matching.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { slugify } from '../src/utils/slugify.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const charactersLocalJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters-local.json');
const characterCachePath = path.join(__dirname, '..', 'public', 'images', 'character-cache');

// Function to calculate similarity between two strings
function calculateNameSimilarity(name1, name2) {
  // Convert to lowercase for case-insensitive comparison
  const a = name1.toLowerCase();
  const b = name2.toLowerCase();
  
  // Exact match
  if (a === b) return 10;
  
  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return 5;
  
  // Check for partial matches (e.g., "James Kirk" vs "Kirk")
  const aParts = a.split(/\s+/);
  const bParts = b.split(/\s+/);
  
  // Check if any part matches exactly
  for (const part1 of aParts) {
    if (part1.length < 3) continue; // Skip short parts
    for (const part2 of bParts) {
      if (part2.length < 3) continue; // Skip short parts
      if (part1 === part2) return 3;
    }
  }
  
  // Check for partial part matches
  for (const part1 of aParts) {
    if (part1.length < 3) continue; // Skip short parts
    for (const part2 of bParts) {
      if (part2.length < 3) continue; // Skip short parts
      if (part1.includes(part2) || part2.includes(part1)) return 2;
    }
  }
  
  // No match
  return 0;
}

async function main() {
  try {
    console.log('Reading characters-local.json...');
    const charactersLocalData = await fs.readFile(charactersLocalJsonPath, 'utf8');
    const characters = JSON.parse(charactersLocalData);
    
    console.log(`Read ${characters.length} characters.`);
    
    // Get all image files in the character-cache directory
    console.log('Reading character-cache directory...');
    const imageFiles = await fs.readdir(characterCachePath);
    console.log(`Found ${imageFiles.length} image files.`);
    
    // Count of characters with improved images
    let improvedCount = 0;
    
    // Process each character
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      
      // Skip if character already has a valid image
      if (char.wikiImage && char.wikiImage.startsWith('/images/character-cache/')) {
        continue;
      }
      
      // Try to find a matching image
      const characterName = char.name.toLowerCase();
      const potentialMatches = [];
      
      // Try exact match first
      const exactMatch = imageFiles.find(file => {
        const fileName = file.toLowerCase();
        return fileName.includes(characterName) || 
               (char.uid && fileName.includes(char.uid.toLowerCase()));
      });
      
      if (exactMatch) {
        char.wikiImage = `/images/character-cache/${exactMatch}`;
        improvedCount++;
        console.log(`✅ Found exact match for ${char.name}: ${exactMatch}`);
        continue;
      }
      
      // Try fuzzy matching
      for (const file of imageFiles) {
        // Extract name from filename (remove extension and uid)
        const fileName = file.toLowerCase();
        const nameMatch = fileName.match(/^(.+?)(?:-[a-z0-9]+)?\.jpg$/i);
        if (!nameMatch) continue;
        
        const fileBaseName = nameMatch[1].replace(/-/g, ' ');
        const similarity = calculateNameSimilarity(characterName, fileBaseName);
        
        if (similarity > 0) {
          potentialMatches.push({
            file,
            similarity
          });
        }
      }
      
      // Sort potential matches by similarity
      if (potentialMatches.length > 0) {
        potentialMatches.sort((a, b) => b.similarity - a.similarity);
        
        // Use the best match
        const bestMatch = potentialMatches[0];
        char.wikiImage = `/images/character-cache/${bestMatch.file}`;
        improvedCount++;
        console.log(`✅ Found fuzzy match for ${char.name}: ${bestMatch.file} (similarity: ${bestMatch.similarity})`);
      }
    }
    
    console.log(`Improved images for ${improvedCount} characters.`);
    
    // Write updated characters back to file
    console.log('Writing updated characters to characters-local.json...');
    await fs.writeFile(charactersLocalJsonPath, JSON.stringify(characters, null, 2));
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();