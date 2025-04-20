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
    return series;
  } catch (error) {
    console.error(`Error fetching series UID:`, error.message);
    return null;
  }
}

// Function to get seasons for a series
async function getSeasonsForSeries(seriesTitle) {
  try {
    console.log(`Fetching seasons for "${seriesTitle}"...`);
    
    // Get all seasons
    const response = await axios.get(`${STAPI_BASE_URL}/season/search`, {
      params: {
        title: seriesTitle,
        pageSize: 100
      }
    });
    
    const seasons = response.data.seasons || [];
    console.log(`Retrieved ${seasons.length} seasons from STAPI`);
    
    return seasons;
  } catch (error) {
    console.error(`Error fetching seasons:`, error.message);
    return [];
  }
}

// Function to get episodes for a season
async function getEpisodesForSeason(seasonUID) {
  try {
    console.log(`Fetching episodes for season UID ${seasonUID}...`);
    
    // Get season details which include episodes
    const response = await axios.get(`${STAPI_BASE_URL}/season?uid=${seasonUID}`);
    
    const season = response.data.season;
    if (!season) {
      console.error(`Season not found for UID: ${seasonUID}`);
      return [];
    }
    
    const episodes = season.episodes || [];
    console.log(`Retrieved ${episodes.length} episodes for this season`);
    
    return episodes;
  } catch (error) {
    console.error(`Error fetching episodes for season:`, error.message);
    return [];
  }
}

// Main function
async function main() {
  const seriesTitle = "Star Trek: The Next Generation";
  
  // Get series info
  const series = await getSeriesUID(seriesTitle);
  if (!series) {
    console.error("Could not find series. Exiting.");
    return;
  }
  
  // Get seasons for this series
  const seasons = await getSeasonsForSeries(seriesTitle);
  if (seasons.length === 0) {
    console.error("No seasons found for this series.");
    return;
  }
  
  // Sort seasons by number
  seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
  
  // Display series info
  console.log("\n=== Series Information ===");
  console.log(`Title: ${series.title}`);
  console.log(`Production Years: ${series.productionStartYear} - ${series.productionEndYear}`);
  console.log(`Seasons: ${series.seasonsCount}`);
  console.log(`Episodes: ${series.episodesCount}`);
  
  // Display seasons and episodes
  console.log("\n=== Seasons and Episodes ===");
  
  // Create a structure to hold all episodes by season
  const episodesBySeason = {};
  
  // Process each season
  for (const season of seasons) {
    console.log(`\nSeason ${season.seasonNumber}:`);
    console.log(`Title: ${season.title}`);
    console.log(`Episodes: ${season.numberOfEpisodes}`);
    
    // Get episodes for this season
    const episodes = await getEpisodesForSeason(season.uid);
    
    // Store episodes for this season
    episodesBySeason[season.seasonNumber] = episodes;
    
    // Sort episodes by episode number
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    
    // Display first 5 episodes as a sample
    const sampleEpisodes = episodes.slice(0, 5);
    if (sampleEpisodes.length > 0) {
      console.log("Sample episodes:");
      sampleEpisodes.forEach(episode => {
        console.log(`  ${episode.episodeNumber}. ${episode.title}`);
        console.log(`     Stardate: ${episode.stardateFrom || 'Unknown'}`);
        console.log(`     Air Date: ${episode.usAirDate || 'Unknown'}`);
      });
      
      if (episodes.length > 5) {
        console.log(`  ... and ${episodes.length - 5} more episodes`);
      }
    } else {
      console.log("No episodes found for this season.");
    }
  }
  
  // Summary of what we found
  console.log("\n=== Summary ===");
  console.log(`Found ${seasons.length} seasons`);
  
  let totalEpisodes = 0;
  Object.values(episodesBySeason).forEach(episodes => {
    totalEpisodes += episodes.length;
  });
  
  console.log(`Found ${totalEpisodes} episodes in total`);
  console.log(`Expected ${series.episodesCount} episodes according to series data`);
}

// Run the script
main().catch(error => {
  console.error("Error in main function:", error);
});