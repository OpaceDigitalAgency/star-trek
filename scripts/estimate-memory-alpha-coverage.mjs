import { stapiService } from '../src/services/stapiService.js';

// Force a fresh fetch by setting SKIP_CHAR_CACHE=true
process.env.SKIP_CHAR_CACHE = 'true';

async function estimateMemoryAlphaCoverage() {
  console.log('Fetching all characters from STAPI...');
  const characters = await stapiService.getAllCharacters();
  console.log(`Fetched ${characters.length} characters from STAPI`);
  
  // Take a random sample of 100 characters
  const sampleSize = 100;
  const shuffled = [...characters].sort(() => 0.5 - Math.random());
  const sample = shuffled.slice(0, sampleSize);
  
  console.log(`Testing a random sample of ${sampleSize} characters...`);
  
  let foundCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sample.length; i++) {
    const char = sample[i];
    console.log(`[${i+1}/${sampleSize}] Testing character: ${char.name}`);
    
    // Process character name for Memory Alpha lookup
    // 1. Expand abbreviated names (e.g. "J. Kirk" → "James T. Kirk")
    // 2. Remove titles (e.g. "Gul Dukat" → "Dukat", "Admiral Janeway" → "Janeway")
    let queryName = char.name.match(/^[A-Z]\./) ? char.fullName ?? char.name : char.name;
    
    // Remove common titles
    const titles = ["Admiral", "Captain", "Commander", "Lieutenant", "Ensign", "Doctor", "Dr.", "Gul", "Legate", "Kai"];
    for (const title of titles) {
      if (queryName.startsWith(title + " ")) {
        queryName = queryName.substring(title.length + 1);
        console.log(`Removed title from ${char.name} → ${queryName}`);
        break;
      }
    }
    
    try {
      const wiki = await stapiService.getMemoryAlphaContent(queryName);
      
      if (wiki?.wikiUrl) {
        foundCount++;
        console.log(`✅ Found Memory Alpha page: ${wiki.wikiUrl}`);
        
        if (wiki?.image?.includes('placeholder') || wiki?.image?.endsWith('.svg')) {
          console.log(`⚠️ Warning: Image is a placeholder or SVG`);
        } else if (wiki?.image) {
          console.log(`✅ Valid image found: ${wiki.image}`);
        } else {
          console.log(`❌ No image found`);
        }
      } else {
        notFoundCount++;
        console.log(`❌ No Memory Alpha page found for ${queryName}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error fetching wiki content for ${queryName}:`, error.message);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n--- RESULTS ---');
  console.log(`Total characters in sample: ${sampleSize}`);
  console.log(`Characters with Memory Alpha pages: ${foundCount} (${(foundCount/sampleSize*100).toFixed(2)}%)`);
  console.log(`Characters without Memory Alpha pages: ${notFoundCount} (${(notFoundCount/sampleSize*100).toFixed(2)}%)`);
  console.log(`Errors: ${errorCount} (${(errorCount/sampleSize*100).toFixed(2)}%)`);
  
  // Estimate for full dataset
  const estimatedTotal = Math.round(characters.length * foundCount / sampleSize);
  console.log(`\nEstimated total characters with Memory Alpha pages: ~${estimatedTotal} out of ${characters.length} (${(estimatedTotal/characters.length*100).toFixed(2)}%)`);
}

estimateMemoryAlphaCoverage();