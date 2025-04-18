#!/usr/bin/env node

/**
 * This script fetches all series data from STAPI,
 * enriches it with Memory Alpha data,
 * and saves it to a local JSON file for faster access.
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

// STAPI API base URL
const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';
const MEMORY_ALPHA_API = 'https://memory-alpha.fandom.com/api.php';

// Helper function to extract years from series data
function extractYears(series) {
  const start = series.productionStartYear || '?';
  const end = series.productionEndYear || 'Present';
  return `${start}-${end}`;
}

// Helper function to extract stardate years from series data
function extractStardateYears(series) {
  const start = series.stardateFrom ? Math.floor(series.stardateFrom) : (
    series.title.includes('Enterprise') ? '2151' :
    series.title.includes('Discovery') ? '2255' :
    series.title.includes('Original') ? '2265' :
    series.title.includes('Animated') ? '2269' :
    series.title.includes('Next Generation') ? '2364' :
    series.title.includes('Deep Space Nine') ? '2369' :
    series.title.includes('Voyager') ? '2371' :
    series.title.includes('Picard') ? '2399' :
    '?'
  );
  
  const end = series.stardateTo ? Math.floor(series.stardateTo) : (
    series.title.includes('Enterprise') ? '2155' :
    series.title.includes('Discovery') && series.productionEndYear < 2020 ? '2258' :
    series.title.includes('Discovery') ? '3190' :
    series.title.includes('Original') ? '2269' :
    series.title.includes('Animated') ? '2270' :
    series.title.includes('Next Generation') ? '2370' :
    series.title.includes('Deep Space Nine') ? '2375' :
    series.title.includes('Voyager') ? '2378' :
    series.title.includes('Picard') ? '2401' :
    '?'
  );
  
  return `${start}-${end}`;
}

// Helper function to get HTML content from Memory Alpha
async function getMemoryAlphaPageHTML(pageName) {
  try {
    const url = `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(pageName)}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Memory Alpha page HTML for ${pageName}:`, error);
    return null;
  }
}

// Helper function to extract image URL from Memory Alpha HTML
function extractMemoryAlphaImageWithParams(html) {
  try {
    if (!html) return null;
    
    const $ = cheerio.load(html);
    
    // Helper function to check if an image URL is valid (not SVG or placeholder)
    const isValidImageUrl = (url) => {
      if (!url) return false;
      
      // Skip SVG images
      if (url.toLowerCase().endsWith('.svg')) return false;
      
      // Skip placeholder images
      if (url.toLowerCase().includes('placeholder')) return false;
      
      return true;
    };
    
    // Try to find the og:image meta tag first (usually the best quality)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && isValidImageUrl(ogImage)) {
      // Use the proxy for the image
      return cleanWikiaImageUrl(ogImage);
    }
    
    // Try to find the main image - look for infobox image
    const infoboxImage = $('.pi-image img').first();
    if (infoboxImage.length) {
      let src = infoboxImage.attr('src');
      if (src && isValidImageUrl(src)) {
        // Use the proxy for the image
        return cleanWikiaImageUrl(src);
      }
    }
    
    // Look for any image in the article content
    const contentImage = $('.mw-parser-output img').first();
    if (contentImage.length) {
      let src = contentImage.attr('src');
      if (src && isValidImageUrl(src)) {
        // Use the proxy for the image
        return cleanWikiaImageUrl(src);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Memory Alpha image:', error);
    return null;
  }
}

// Helper function to clean Wikia image URLs
function cleanWikiaImageUrl(url) {
  if (!url) return null;
  
  try {
    // Make sure the URL has /revision/latest if it's from Wikia
    if (url.includes('static.wikia.nocookie.net') && !url.includes('/revision/latest')) {
      url = url.replace(/\/revision\/[^\/]+/g, '/revision/latest');
    }
    
    // Ensure we have a clean URL path
    return url;
  } catch (error) {
    console.error('Error cleaning Wikia image URL:', error);
    return url; // Return original URL if there's an error
  }
}

// Helper function to proxy image URL through our Netlify function
function proxyImageUrl(url) {
  if (!url) return null;
  
  // Create a URL object to properly encode the parameters
  const proxyUrl = new URL('/.netlify/functions/proxy-image', 'https://star-trek-timelines.netlify.app');
  proxyUrl.searchParams.append('url', url);
  
  return proxyUrl.toString();
}

// Helper function to get Memory Alpha content
async function getMemoryAlphaContent(title) {
  try {
    // First, try to get the HTML content
    const html = await getMemoryAlphaPageHTML(title);
    if (!html) {
      return {
        wikiUrl: null,
        image: null,
        summary: null
      };
    }
    
    // Extract the image
    const imageUrl = extractMemoryAlphaImageWithParams(html);
    const proxiedImageUrl = imageUrl ? proxyImageUrl(imageUrl) : null;
    
    // Extract the summary
    const $ = cheerio.load(html);
    let summary = '';
    
    // Try to get the first paragraph of content
    $('.mw-parser-output > p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50 && !summary) { // Only get the first substantial paragraph
        summary = $(el).html();
      }
    });
    
    // Return the data
    return {
      wikiUrl: `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(title)}`,
      image: proxiedImageUrl,
      summary: summary
    };
  } catch (error) {
    console.error(`Error getting Memory Alpha content for ${title}:`, error);
    return {
      wikiUrl: null,
      image: null,
      summary: null
    };
  }
}

// Helper function to get image URL for a series
function getImageUrl(name, type = 'series') {
  // For series, use the placeholder images
  if (type === 'series') {
    // Map series names to their placeholder image files
    const seriesMapping = {
      'The Original Series': 'tos',
      'TOS': 'tos',
      'The Animated Series': 'tas',
      'TAS': 'tas',
      'The Next Generation': 'tng',
      'TNG': 'tng',
      'Deep Space Nine': 'ds9',
      'DS9': 'ds9',
      'Voyager': 'voy',
      'VOY': 'voy',
      'Enterprise': 'ent',
      'ENT': 'ent',
      'Discovery': 'disco',
      'DISC': 'disco',
      'Picard': 'picard',
      'PIC': 'picard'
    };
    
    // Try to find a match in the mapping
    for (const [seriesName, placeholder] of Object.entries(seriesMapping)) {
      if (name.includes(seriesName)) {
        return `/images/placeholder-${placeholder}.jpg`;
      }
    }
    
    // Default to a generic placeholder
    return '/images/stars-placeholder.jpg';
  }
  
  // Default fallback
  return '/images/stars-placeholder.jpg';
}

async function buildSeriesCache() {
  try {
    console.log('Fetching series data from STAPI...');
    
    // Fetch all series from STAPI
    const response = await axios.get(`${STAPI_BASE_URL}/series/search?pageSize=100`);
    let allSeries = response.data.series || [];
    
    console.log(`Fetched ${allSeries.length} series from STAPI`);
    
    // Filter out irrelevant entries and ensure we have the main series
    const mainSeries = ["Star Trek", "Star Trek: The Next Generation", "Star Trek: Deep Space Nine", 
                        "Star Trek: Voyager", "Star Trek: Enterprise", "Star Trek: Discovery", 
                        "Star Trek: Picard", "Star Trek: The Animated Series"];
    
    allSeries = allSeries.filter(series => mainSeries.includes(series.title));
    
    // If STAPI fails or returns insufficient data, use fallback
    if (allSeries.length < 5) {
      console.log('STAPI returned insufficient data, using fallback data');
      allSeries = [
        {
          title: "Star Trek: The Original Series",
          uid: "SRMA0000001", // Made-up UID
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
          uid: "SRMA0000002", // Made-up UID
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
          uid: "SRMA0000003", // Made-up UID
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
          uid: "SRMA0000004", // Made-up UID
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
          uid: "SRMA0000005", // Made-up UID
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
          uid: "SRMA0000006", // Made-up UID
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
          uid: "SRMA0000007", // Made-up UID
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
          uid: "SRMA0000008", // Made-up UID
          abbreviation: "PIC",
          productionStartYear: 2020,
          productionEndYear: 2023,
          seasonsCount: 3,
          episodesCount: 30,
          originalNetwork: "CBS All Access/Paramount+",
          productionCompany: "CBS Studios"
        }
      ];
    }
    
    // Enhance series data with additional fields
    const enhancedSeries = allSeries.map(series => ({
      ...series,
      years: extractYears(series),
      stardate: extractStardateYears(series),
      image: getImageUrl(series.title, 'series'),
      slug: series.uid || series.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }));
    
    console.log('Enhancing series data with Memory Alpha information...');
    
    // Enhance with Memory Alpha data
    for (let i = 0; i < enhancedSeries.length; i++) {
      try {
        const series = enhancedSeries[i];
        const wikiTitle = series.title.replace('Star Trek: ', '');
        console.log(`Fetching Memory Alpha data for ${wikiTitle} (${i+1}/${enhancedSeries.length})...`);
        
        const wikiData = await getMemoryAlphaContent(wikiTitle);
        
        if (wikiData.image) {
          series.wikiImage = wikiData.image;
        }
        if (wikiData.summary) {
          series.wikiSummary = wikiData.summary;
        }
        series.wikiUrl = wikiData.wikiUrl;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching Memory Alpha data for series:`, error);
      }
    }
    
    console.log(`Writing ${enhancedSeries.length} series to ${seriesJsonPath}`);
    
    // Write the enhanced series data to the JSON file
    await fs.writeFile(seriesJsonPath, JSON.stringify(enhancedSeries, null, 2));
    
    console.log('Series cache built successfully!');
  } catch (error) {
    console.error('Error building series cache:', error);
    process.exit(1);
  }
}

// Run the function
buildSeriesCache();