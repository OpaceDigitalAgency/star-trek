#!/usr/bin/env node

/**
 * This script builds a local cache of Star Trek series data from STAPI.
 * It fetches all series, enhances them with additional data, and saves them to src/data/series.json.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const seriesJsonPath = path.join(__dirname, '..', 'src', 'data', 'series.json');
const seriesImageCachePath = path.join(__dirname, '..', 'public', 'images', 'series-cache');

// STAPI API base URL
const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';
const MEMORY_ALPHA_API = 'https://memory-alpha.fandom.com/api.php';

// Helper function to extract years from a series
function extractYears(series) {
  if (series.productionStartYear && series.productionEndYear) {
    return `${series.productionStartYear}–${series.productionEndYear}`;
  } else if (series.productionStartYear) {
    return `${series.productionStartYear}–present`;
  }
  return 'Unknown';
}

// Helper function to extract stardate years from a series
function extractStardateYears(series) {
  if (series.stardateFrom && series.stardateTo) {
    return `${series.stardateFrom}–${series.stardateTo}`;
  } else if (series.stardateFrom) {
    return `${series.stardateFrom}+`;
  }
  return null;
}

// Helper function to get a placeholder image URL for a series
function getSeriesImageUrl(seriesTitle) {
  // Memory Alpha pages for Star Trek series
  const seriesMapping = {
    'Star Trek': 'Star_Trek:_The_Original_Series',
    'The Original Series': 'Star_Trek:_The_Original_Series',
    'TOS': 'Star_Trek:_The_Original_Series',
    'Star Trek: The Next Generation': 'Star_Trek:_The_Next_Generation',
    'The Next Generation': 'Star_Trek:_The_Next_Generation',
    'TNG': 'Star_Trek:_The_Next_Generation',
    'Star Trek: Deep Space Nine': 'Star_Trek:_Deep_Space_Nine',
    'Deep Space Nine': 'Star_Trek:_Deep_Space_Nine',
    'DS9': 'Star_Trek:_Deep_Space_Nine',
    'Star Trek: Voyager': 'Star_Trek:_Voyager',
    'Voyager': 'Star_Trek:_Voyager',
    'VOY': 'Star_Trek:_Voyager',
    'Star Trek: Enterprise': 'Star_Trek:_Enterprise',
    'Enterprise': 'Star_Trek:_Enterprise',
    'ENT': 'Star_Trek:_Enterprise',
    'Star Trek: Discovery': 'Star_Trek:_Discovery',
    'Discovery': 'Star_Trek:_Discovery',
    'DISC': 'Star_Trek:_Discovery',
    'Star Trek: Picard': 'Star_Trek:_Picard',
    'Picard': 'Star_Trek:_Picard',
    'PIC': 'Star_Trek:_Picard',
    'Star Trek: The Animated Series': 'Star_Trek:_The_Animated_Series',
    'The Animated Series': 'Star_Trek:_The_Animated_Series',
    'TAS': 'Star_Trek:_The_Animated_Series',
    'Star Trek: Strange New Worlds': 'Star_Trek:_Strange_New_Worlds',
    'Strange New Worlds': 'Star_Trek:_Strange_New_Worlds',
    'SNW': 'Star_Trek:_Strange_New_Worlds',
    'Star Trek: Lower Decks': 'Star_Trek:_Lower_Decks',
    'Lower Decks': 'Star_Trek:_Lower_Decks',
    'LD': 'Star_Trek:_Lower_Decks'
  };
  
  // Construct placeholder image path
  if (seriesTitle && seriesMapping[seriesTitle]) {
    const seriesKey = seriesMapping[seriesTitle].toLowerCase()
      .replace(/^star_trek:_/, '')
      .replace(/_/g, '-');
    return `/images/placeholder-${seriesKey}.jpg`;
  }
  
  return '/images/stars-placeholder.jpg';
}

// Helper function to get Memory Alpha content
async function getMemoryAlphaContent(title) {
  try {
    const pageName = title.replace(/\s+/g, '_');
    const url = `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(pageName)}`;
    
    // Get the page HTML
    const response = await axios.get(url);
    const html = response.data;
    
    // Extract information from the page
    const $ = cheerio.load(html);
    
    // Extract summary text (first paragraph or two)
    let summary = '';
    $('.mw-parser-output > p').each((i, el) => {
      if (i < 2 && $(el).text().trim().length > 0) {
        summary += $(el).html();
      }
    });
    
    // Extract the image
    let imageUrl = null;
    
    // Try to find the og:image meta tag first (usually the best quality)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      imageUrl = ogImage;
    }
    
    // If no valid image was found, fall back to the static image service
    if (!imageUrl) {
      imageUrl = getSeriesImageUrl(title);
    }
    
    return {
      title: title,
      summary: summary || null,
      image: imageUrl,
      wikiUrl: url
    };
  } catch (error) {
    console.error(`Error fetching Memory Alpha content for ${title}:`, error);
    return {
      title: title,
      summary: null,
      image: getSeriesImageUrl(title),
      wikiUrl: `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`
    };
  }
}

async function buildSeriesCache() {
  try {
    console.log('Fetching series data from STAPI...');
    
    // Fetch all series from STAPI
    const response = await axios.get(`${STAPI_BASE_URL}/series/search?pageSize=100`);
    let allSeries = response.data.series || [];
    
    // Filter out irrelevant entries and ensure we have the main series
    const mainSeries = [
      "Star Trek", "Star Trek: The Next Generation", "Star Trek: Deep Space Nine", 
      "Star Trek: Voyager", "Star Trek: Enterprise", "Star Trek: Discovery", 
      "Star Trek: Picard", "Star Trek: The Animated Series", "Star Trek: Strange New Worlds",
      "Star Trek: Lower Decks", "Star Trek: Prodigy"
    ];
    
    allSeries = allSeries.filter(series => mainSeries.includes(series.title));
    
    // If STAPI fails or returns insufficient data, use fallback
    if (allSeries.length < 5) {
      console.log('STAPI returned insufficient data, using fallback...');
      allSeries = [
        {
          title: "Star Trek: The Original Series",
          uid: "SRMA0000001",
          abbreviation: "TOS",
          productionStartYear: 1966,
          productionEndYear: 1969,
          seasonsCount: 3,
          episodesCount: 79,
          originalNetwork: "NBC",
          productionCompany: "Desilu Productions"
        },
        {
          title: "Star Trek: The Animated Series",
          uid: "SRMA0000002",
          abbreviation: "TAS",
          productionStartYear: 1973,
          productionEndYear: 1974,
          seasonsCount: 2,
          episodesCount: 22,
          originalNetwork: "NBC",
          productionCompany: "Filmation"
        },
        {
          title: "Star Trek: The Next Generation",
          uid: "SRMA0000003",
          abbreviation: "TNG",
          productionStartYear: 1987,
          productionEndYear: 1994,
          seasonsCount: 7,
          episodesCount: 178,
          originalNetwork: "Syndication",
          productionCompany: "Paramount Television"
        },
        {
          title: "Star Trek: Deep Space Nine",
          uid: "SRMA0000004",
          abbreviation: "DS9",
          productionStartYear: 1993,
          productionEndYear: 1999,
          seasonsCount: 7,
          episodesCount: 176,
          originalNetwork: "Syndication",
          productionCompany: "Paramount Television"
        },
        {
          title: "Star Trek: Voyager",
          uid: "SRMA0000005",
          abbreviation: "VOY",
          productionStartYear: 1995,
          productionEndYear: 2001,
          seasonsCount: 7,
          episodesCount: 172,
          originalNetwork: "UPN",
          productionCompany: "Paramount Television"
        },
        {
          title: "Star Trek: Enterprise",
          uid: "SRMA0000006",
          abbreviation: "ENT",
          productionStartYear: 2001,
          productionEndYear: 2005,
          seasonsCount: 4,
          episodesCount: 98,
          originalNetwork: "UPN",
          productionCompany: "Paramount Television"
        },
        {
          title: "Star Trek: Discovery",
          uid: "SRMA0000007",
          abbreviation: "DISC",
          productionStartYear: 2017,
          productionEndYear: 2024,
          seasonsCount: 5,
          episodesCount: 65,
          originalNetwork: "CBS All Access/Paramount+",
          productionCompany: "CBS Studios"
        },
        {
          title: "Star Trek: Picard",
          uid: "SRMA0000008",
          abbreviation: "PIC",
          productionStartYear: 2020,
          productionEndYear: 2023,
          seasonsCount: 3,
          episodesCount: 30,
          originalNetwork: "CBS All Access/Paramount+",
          productionCompany: "CBS Studios"
        },
        {
          title: "Star Trek: Strange New Worlds",
          uid: "SRMA0000009",
          abbreviation: "SNW",
          productionStartYear: 2022,
          productionEndYear: null,
          seasonsCount: 2,
          episodesCount: 20,
          originalNetwork: "Paramount+",
          productionCompany: "CBS Studios"
        },
        {
          title: "Star Trek: Lower Decks",
          uid: "SRMA0000010",
          abbreviation: "LD",
          productionStartYear: 2020,
          productionEndYear: null,
          seasonsCount: 4,
          episodesCount: 40,
          originalNetwork: "Paramount+",
          productionCompany: "CBS Studios"
        },
        {
          title: "Star Trek: Prodigy",
          uid: "SRMA0000011",
          abbreviation: "PRO",
          productionStartYear: 2021,
          productionEndYear: 2023,
          seasonsCount: 1,
          episodesCount: 20,
          originalNetwork: "Paramount+",
          productionCompany: "CBS Studios"
        }
      ];
    }
    
    // Map STAPI data to our format
    allSeries = allSeries.map(series => ({
      ...series,
      years: extractYears(series),
      stardate: extractStardateYears(series),
      image: getSeriesImageUrl(series.title),
      slug: series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }));
    
    // Enhance with Memory Alpha data for each series
    console.log('Enhancing series data with Memory Alpha content...');
    for (let i = 0; i < allSeries.length; i++) {
      try {
        const series = allSeries[i];
        console.log(`Processing ${series.title}...`);
        
        // Get the Memory Alpha page title (remove "Star Trek: " prefix if present)
        const wikiTitle = series.title.replace('Star Trek: ', '');
        const wikiData = await getMemoryAlphaContent(wikiTitle);
        
        if (wikiData.image) {
          series.wikiImage = wikiData.image;
        }
        if (wikiData.summary) {
          series.wikiSummary = wikiData.summary;
        }
        series.wikiUrl = wikiData.wikiUrl;
      } catch (error) {
        console.error(`Error fetching Memory Alpha data for series ${allSeries[i].title}:`, error);
      }
    }
    
    // Create the series-cache directory if it doesn't exist
    try {
      await fs.mkdir(seriesImageCachePath, { recursive: true });
    } catch (error) {
      console.error('Error creating series-cache directory:', error);
    }
    
    // Write the data to the file
    console.log(`Writing ${allSeries.length} series to ${seriesJsonPath}...`);
    await fs.writeFile(seriesJsonPath, JSON.stringify(allSeries, null, 2));
    
    console.log('Series cache built successfully!');
  } catch (error) {
    console.error('Error building series cache:', error);
  }
}

// Run the script
buildSeriesCache();