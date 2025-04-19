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
        'PIC': 'Star Trek: Picard',
        'LD': 'Star Trek: Lower Decks',
        'PRO': 'Star Trek: Prodigy',
        'SNW': 'Star Trek: Strange New Worlds'
      };
      
      return abbreviationMap[seriesAbbreviation] === seriesTitle;
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
      const seasons = await getSeasonsForSeries(series.title);
      
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