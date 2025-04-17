import { stapiService } from '../src/services/stapiService.js';

// List of characters to test
const charactersToTest = [
  // Main characters
  "James T. Kirk",
  "Jean-Luc Picard",
  "Spock",
  "Data",
  "Benjamin Sisko",
  "Kathryn Janeway",
  
  // Less known characters
  "Dukat",
  "Elim Garak",
  "Lwaxana Troi",
  "Nog"
];

async function testMemoryAlphaImages() {
  console.log('Testing Memory Alpha image retrieval for important characters...\n');
  
  for (const characterName of charactersToTest) {
    console.log(`Testing character: ${characterName}`);
    
    try {
      const wiki = await stapiService.getMemoryAlphaContent(characterName);
      
      console.log(`  Wiki URL: ${wiki?.wikiUrl || 'Not found'}`);
      console.log(`  Image URL: ${wiki?.image || 'Not found'}`);
      
      if (wiki?.image?.includes('placeholder') || wiki?.image?.endsWith('.svg')) {
        console.log('  ⚠️ Warning: Image is a placeholder or SVG');
      } else if (wiki?.image) {
        console.log('  ✅ Valid image found');
      } else {
        console.log('  ❌ No image found');
      }
      
      console.log(''); // Empty line for readability
    } catch (error) {
      console.error(`  ❌ Error fetching wiki content for ${characterName}:`, error);
      console.log(''); // Empty line for readability
    }
  }
}

testMemoryAlphaImages();