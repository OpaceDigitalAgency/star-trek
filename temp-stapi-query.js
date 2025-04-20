import axios from 'axios';

// STAPI API base URL
const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Function to get series UID
async function getSeriesUID(seriesTitle) {
  try {
    console.log(`Fetching series UID for "${seriesTitle}"...`);
    
    // Get all series and find the exact match
    const response = await axios.get(`${STAPI_BASE_URL}/series/search`, {
      params: {
        pageSize: 100
      }
    });
    
    const allSeries = response.data.series || [];
    console.log(`Retrieved ${allSeries.length} series from STAPI`);
    
    // Find exact match
    const series = allSeries.find(s => s.title === seriesTitle);
    if (!series) {
      console.error(`Series not found: ${seriesTitle}`);
      return null;
    }
    
    console.log(`Found series: ${series.title} (UID: ${series.uid})`);
    return series.uid;
  } catch (error) {
    console.error(`Error fetching series UID:`, error.message);
    return null;
  }
}

// Function to get top characters
async function getTopCharacters(seriesTitle) {
  try {
    console.log(`Fetching top characters from STAPI...`);
    
    // Get main characters directly by name
    const mainCharacters = [];
    
    // Define main TNG characters to search for
    const tngMainCharacters = [
      { name: "Jean-Luc Picard", performer: "Patrick Stewart" },
      { name: "William Riker", performer: "Jonathan Frakes" },
      { name: "Data", performer: "Brent Spiner" },
      { name: "Deanna Troi", performer: "Marina Sirtis" },
      { name: "Worf", performer: "Michael Dorn" },
      { name: "Beverly Crusher", performer: "Gates McFadden" },
      { name: "Geordi La Forge", performer: "LeVar Burton" },
      { name: "Wesley Crusher", performer: "Wil Wheaton" }
    ];
    
    // Search for each character by name
    for (const char of tngMainCharacters) {
      console.log(`Searching for character: ${char.name}`);
      
      const response = await axios.get(`${STAPI_BASE_URL}/character/search`, {
        params: {
          name: char.name,
          pageSize: 10
        }
      });
      
      const characters = response.data.characters || [];
      console.log(`Found ${characters.length} matches for "${char.name}"`);
      
      if (characters.length > 0) {
        // Find exact match or take first result
        const exactMatch = characters.find(c => c.name === char.name) || characters[0];
        mainCharacters.push({
          ...exactMatch,
          expectedPerformer: char.performer
        });
      }
    }
    
    return mainCharacters;
  } catch (error) {
    console.error(`Error fetching characters:`, error.message);
    return [];
  }
}

// Main function
async function main() {
  const seriesTitle = "Star Trek: The Next Generation";
  
  // Get series UID (just for reference)
  const seriesUID = await getSeriesUID(seriesTitle);
  if (!seriesUID) {
    console.error("Could not find series UID. Exiting.");
    return;
  }
  
  // Get top characters by direct search
  const characters = await getTopCharacters(seriesTitle);
  
  // Display the results
  console.log("\n=== Main Characters for Star Trek: The Next Generation ===\n");
  
  if (characters.length === 0) {
    console.log("No characters found.");
    return;
  }
  
  characters.forEach((char, index) => {
    console.log(`${index + 1}. ${char.name}`);
    console.log(`   Expected Performer: ${char.expectedPerformer}`);
    console.log(`   Actual Performer: ${char.performer?.name || 'Unknown'}`);
    console.log(`   UID: ${char.uid}`);
    console.log(`   Gender: ${char.gender || 'Unknown'}`);
    console.log(`   Species: ${char.characterSpecies?.map(s => s.name).join(', ') || 'Unknown'}`);
    
    // Show episodes if available
    if (char.episodes && char.episodes.length > 0) {
      console.log(`   Episodes: ${char.episodes.length}`);
      console.log(`   First few episodes: ${char.episodes.slice(0, 3).map(e => e.title).join(', ')}...`);
    } else {
      console.log(`   Episodes: None listed in API`);
    }
    
    console.log();
  });
}

// Run the script
main().catch(error => {
  console.error("Error in main function:", error);
});