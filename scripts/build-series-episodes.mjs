#!/usr/bin/env node

/**
 * This script enhances the series.json file with episode data from STAPI.
 * It fetches seasons and episodes for each series and adds them to the series data.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { slugify } from '../src/utils/slugify.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const seriesJsonPath = path.join(__dirname, '..', 'src', 'data', 'series.json');

// STAPI API base URL
const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Helper function to get series UID from STAPI
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
    
    // Filter seasons to those that match the series title
    const filteredSeasons = seasons.filter(season => {
      // Extract series title from season title (e.g., "TNG Season 1" -> "TNG")
      const seasonTitleParts = season.title.split(' ');
      const seriesAbbreviation = seasonTitleParts[0];
      
      // Map abbreviations to full titles
      const abbreviationMap = {
        'TOS': 'Star Trek: The Original Series',
        'TAS': 'Star Trek: The Animated Series',
        'TNG': 'Star Trek: The Next Generation',
        'DS9': 'Star Trek: Deep Space Nine',
        'VOY': 'Star Trek: Voyager',
        'ENT': 'Star Trek: Enterprise',
        'DIS': 'Star Trek: Discovery',
        'DISC': 'Star Trek: Discovery',
        'PIC': 'Star Trek: Picard',
        'LD': 'Star Trek: Lower Decks',
        'LDS': 'Star Trek: Lower Decks',
        'PRO': 'Star Trek: Prodigy',
        'SNW': 'Star Trek: Strange New Worlds'
      };
      
      // Check if the season belongs to this series
      // 1. Check if the abbreviation maps to the series title
      if (abbreviationMap[seriesAbbreviation] === seriesTitle) {
        return true;
      }
      
      // 2. Check if the season title contains the series title or a key part of it
      const seriesTitleParts = seriesTitle.split(':');
      const mainTitle = seriesTitleParts.length > 1 ? seriesTitleParts[1].trim() : seriesTitle;
      if (season.title.includes(mainTitle)) {
        return true;
      }
      
      // 3. Check if the season's series UID matches the series UID (if available)
      if (season.series && season.series.title === seriesTitle) {
        return true;
      }
      
      return false;
    });
    
    console.log(`Filtered to ${filteredSeasons.length} seasons for ${seriesTitle}`);
    
    // Sort seasons by season number
    filteredSeasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
    
    return filteredSeasons;
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

// Main function to build the series episodes cache
async function buildSeriesEpisodesCache() {
  try {
    console.log('Building series episodes cache...');
    
    // Load existing series data
    const seriesData = JSON.parse(await fs.readFile(seriesJsonPath, 'utf8'));
    console.log(`Loaded ${seriesData.length} series from series.json`);
    
    // Process each series
    for (const series of seriesData) {
      console.log(`\nProcessing series: ${series.title}`);
      
      // Get seasons for this series
      let seasons = await getSeasonsForSeries(series.title);
      
      // Verify we have the expected number of seasons
      if (seasons.length !== series.seasonsCount) {
        console.warn(`Warning: Found ${seasons.length} seasons for ${series.title}, but expected ${series.seasonsCount}`);
        
        // Try a more aggressive search if we're missing seasons
        if (seasons.length < series.seasonsCount) {
          console.log(`Trying more aggressive season search for ${series.title}...`);
          
          // Try searching by abbreviation
          const abbreviation = series.abbreviation || series.title.split(':').pop().trim().split(' ').map(word => word[0]).join('');
          console.log(`Searching for seasons with abbreviation: ${abbreviation}`);
          
          try {
            const response = await axios.get(`${STAPI_BASE_URL}/season/search`, {
              params: {
                pageSize: 100
              }
            });
            
            const allSeasons = response.data.seasons || [];
            console.log(`Retrieved ${allSeasons.length} total seasons from STAPI`);
            
            // Find seasons that might match this series
            const potentialSeasons = allSeasons.filter(season => {
              // Check if the season title contains the series abbreviation
              return season.title.includes(abbreviation) ||
                     // Or if it contains a key part of the series title
                     series.title.split(':').pop().trim().split(' ').some(word =>
                       word.length > 3 && season.title.includes(word)
                     );
            });
            
            console.log(`Found ${potentialSeasons.length} potential seasons for ${series.title}`);
            
            // Add any new seasons that weren't already found
            for (const potentialSeason of potentialSeasons) {
              if (!seasons.some(s => s.uid === potentialSeason.uid)) {
                console.log(`Adding additional season: ${potentialSeason.title}`);
                seasons.push(potentialSeason);
              }
            }
            
            // Sort seasons by season number
            seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
          } catch (error) {
            console.error(`Error in aggressive season search:`, error.message);
          }
        }
      }
      
      if (seasons.length === 0) {
        console.log(`No seasons found for ${series.title}, skipping...`);
        continue;
      }
      
      // Initialize episodes array
      series.episodes = [];
      
      // Process each season
      for (const season of seasons) {
        console.log(`Processing season ${season.seasonNumber} (${season.title})...`);
        
        // Get episodes for this season
        const episodes = await getEpisodesForSeason(season.uid);
        
        if (episodes.length === 0) {
          console.warn(`Warning: No episodes found for season ${season.seasonNumber} of ${series.title}`);
          
          // For newer shows with missing episode data, add real or placeholder episodes
          if (series.title === "Star Trek: Strange New Worlds" && season.seasonNumber > 1) {
            console.log(`Adding episodes for ${series.title} season ${season.seasonNumber}`);
            
            // Real episode data for Strange New Worlds Season 2
            if (season.seasonNumber === 2) {
              const snwSeason2Episodes = [
                {
                  uid: "SNW-S2E1",
                  title: "The Broken Circle",
                  episodeNumber: 1,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-06-15",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E2",
                  title: "Ad Astra per Aspera",
                  episodeNumber: 2,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-06-22",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E3",
                  title: "Tomorrow and Tomorrow and Tomorrow",
                  episodeNumber: 3,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-06-29",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E4",
                  title: "Among the Lotus Eaters",
                  episodeNumber: 4,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-07-06",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E5",
                  title: "Charades",
                  episodeNumber: 5,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-07-13",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E6",
                  title: "Lost in Translation",
                  episodeNumber: 6,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-07-20",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E7",
                  title: "Those Old Scientists",
                  episodeNumber: 7,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-07-27",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E8",
                  title: "Under the Cloak of War",
                  episodeNumber: 8,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-08-03",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E9",
                  title: "Subspace Rhapsody",
                  episodeNumber: 9,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-08-10",
                  finalScriptDate: null
                },
                {
                  uid: "SNW-S2E10",
                  title: "Hegemony",
                  episodeNumber: 10,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2259,
                  yearTo: 2259,
                  usAirDate: "2023-08-17",
                  finalScriptDate: null
                }
              ];
              
              // Add season information to each episode
              const enhancedEpisodes = snwSeason2Episodes.map(episode => ({
                ...episode,
                season: {
                  seasonNumber: season.seasonNumber,
                  title: season.title
                }
              }));
              
              // Add episodes to series
              series.episodes.push(...enhancedEpisodes);
              console.log(`Added ${enhancedEpisodes.length} real episodes for ${series.title} season ${season.seasonNumber}`);
              continue;
            }
            // For Season 3, use placeholder episodes
            else if (season.seasonNumber === 3) {
              const placeholderCount = 10; // 10 episodes per season
              const placeholderEpisodes = [];
              
              for (let i = 1; i <= placeholderCount; i++) {
                placeholderEpisodes.push({
                  uid: `PLACEHOLDER-${series.abbreviation}-S${season.seasonNumber}E${i}`,
                  title: `Season ${season.seasonNumber} Episode ${i}`,
                  episodeNumber: i,
                  stardateFrom: null,
                  stardateTo: null,
                  yearFrom: 2260,
                  yearTo: 2260,
                  usAirDate: null,
                  finalScriptDate: null,
                  season: {
                    seasonNumber: season.seasonNumber,
                    title: season.title
                  }
                });
              }
              
              // Add placeholder episodes to series
              series.episodes.push(...placeholderEpisodes);
              console.log(`Added ${placeholderEpisodes.length} placeholder episodes for ${series.title} season ${season.seasonNumber}`);
              continue;
            }
          }
          
          // For other shows, skip the season
          continue;
        }
        
        // Add season information to each episode
        const enhancedEpisodes = episodes.map(episode => ({
          ...episode,
          season: {
            seasonNumber: season.seasonNumber,
            title: season.title
          }
        }));
        
        // Add episodes to series
        series.episodes.push(...enhancedEpisodes);
      }
      
      console.log(`Added ${series.episodes.length} episodes to ${series.title}`);
      
      // Verify we have a reasonable number of episodes
      if (series.episodes.length < series.episodesCount * 0.8) {
        console.warn(`Warning: Only found ${series.episodes.length} episodes for ${series.title}, but expected around ${series.episodesCount}`);
      }
    }
    
    // Write the updated data back to the file
    console.log(`\nWriting updated series data to ${seriesJsonPath}...`);
    await fs.writeFile(seriesJsonPath, JSON.stringify(seriesData, null, 2));
    
    console.log('Series episodes cache built successfully!');
  } catch (error) {
    console.error('Error building series episodes cache:', error);
  }
}

// Run the script
buildSeriesEpisodesCache();