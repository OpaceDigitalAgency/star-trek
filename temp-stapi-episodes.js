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

// Function to get episodes for a series
async function getEpisodesForSeries(seriesUID) {
  try {
    console.log(`Fetching episodes for series UID ${seriesUID}...`);
    
    // Get episodes for this series
    const response = await axios.get(`${STAPI_BASE_URL}/episode/search`, {
      params: {
        pageSize: 100,
        pageNumber: 0,
        seasonNumber: 1 // Start with season 1
      }
    });
    
    let episodes = response.data.episodes || [];
    console.log(`Retrieved ${episodes.length} total episodes from STAPI`);
    
    // Filter episodes to those from this series
    const seriesEpisodes = episodes.filter(episode => 
      episode.series?.uid === seriesUID
    );
    
    console.log(`Found ${seriesEpisodes.length} episodes for this series`);
    
    // Group episodes by season
    const episodesBySeason = {};
    seriesEpisodes.forEach(episode => {
      const seasonNum = episode.seasonNumber || 'Unknown';
      if (!episodesBySeason[seasonNum]) {
        episodesBySeason[seasonNum] = [];
      }
      episodesBySeason[seasonNum].push(episode);
    });
    
    // Sort episodes within each season
    Object.values(episodesBySeason).forEach(seasonEpisodes => {
      seasonEpisodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
    });
    
    return episodesBySeason;
  } catch (error) {
    console.error(`Error fetching episodes:`, error.message);
    return {};
  }
}

// Main function
async function main() {
  const seriesTitle = "Star Trek: The Next Generation";
  
  // Get series UID
  const seriesUID = await getSeriesUID(seriesTitle);
  if (!seriesUID) {
    console.error("Could not find series UID. Exiting.");
    return;
  }
  
  // Get episodes for this series
  const episodesBySeason = await getEpisodesForSeries(seriesUID);
  
  // Display the results
  console.log("\n=== Episodes for Star Trek: The Next Generation ===\n");
  
  const seasons = Object.keys(episodesBySeason).sort((a, b) => {
    // Sort numerically, but keep 'Unknown' at the end
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(a) - parseInt(b);
  });
  
  if (seasons.length === 0) {
    console.log("No episodes found.");
    return;
  }
  
  seasons.forEach(season => {
    console.log(`\nSeason ${season}:`);
    
    const episodes = episodesBySeason[season];
    episodes.forEach((episode, index) => {
      console.log(`  ${episode.episodeNumber || '?'}. ${episode.title}`);
      console.log(`     Stardate: ${episode.stardateFrom || 'Unknown'}`);
      console.log(`     Air Date: ${episode.usAirDate || 'Unknown'}`);
    });
  });
}

// Run the script
main().catch(error => {
  console.error("Error in main function:", error);
});