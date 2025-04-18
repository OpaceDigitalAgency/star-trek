// netlify/functions/series-detail.js
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Helper function to slugify text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

exports.handler = async (event) => {
  try {
    // Get the slug from the query parameters or path
    let slug;
    
    // Check if slug is in query parameters
    if (event.queryStringParameters && event.queryStringParameters.slug) {
      slug = event.queryStringParameters.slug;
    } else {
      // Fallback to extracting from path
      const pathParts = event.path.split('/').filter(Boolean);
      slug = pathParts[pathParts.length - 1];
    }
    
    // Remove trailing slash if present
    if (slug && slug.endsWith('/')) {
      slug = slug.slice(0, -1);
    }
    
    console.log(`Processing series detail request for slug: ${slug}, original path: ${event.path}`);
    
    // Load all series data
    let allSeries = [];
    try {
      // Try to import the local series data
      const seriesJsonPath = path.join(__dirname, '..', '..', 'src', 'data', 'series.json');
      
      if (fs.existsSync(seriesJsonPath)) {
        allSeries = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
      } else {
        // Fallback to STAPI API if local data is not available
        const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
        const data = await response.json();
        allSeries = data.series || [];
      }
    } catch (error) {
      console.error('Failed to load series data:', error);
      // Fallback to STAPI API
      const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
      const data = await response.json();
      allSeries = data.series || [];
    }
    
    // Find the series by slug or UID
    let series = allSeries.find(s => {
      // Ensure we're using the same slug format consistently
      const seriesSlug = s.slug || slugify(s.title);
      return seriesSlug === slug || s.uid === slug;
    });
    
    // If not found, return 404 with more detailed error message
    if (!series) {
      // Get a list of available slugs for debugging
      const availableSlugs = allSeries.map(s => s.slug || slugify(s.title));
      
      console.error(`Series not found with slug: ${slug}`);
      console.error(`Available slugs: ${availableSlugs.join(', ')}`);
      
      // Check if there's a close match (for debugging purposes)
      const possibleMatches = availableSlugs.filter(s =>
        s.includes(slug) || slug.includes(s) ||
        s.toLowerCase() === slug.toLowerCase()
      );
      
      if (possibleMatches.length > 0) {
        console.error(`Possible matches found: ${possibleMatches.join(', ')}`);
      }
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          error: 'Series not found',
          message: `No series found with slug or UID: ${slug}`,
          availableSlugs: availableSlugs,
          possibleMatches: possibleMatches.length > 0 ? possibleMatches : undefined
        })
      };
    }
    
    // Get and organize episodes for this series
    if (!series.episodes) {
      try {
        const response = await fetch(`${STAPI_BASE_URL}/episode/search?title=${encodeURIComponent(series.title)}&pageSize=100`);
        const data = await response.json();
        const episodes = data.episodes || [];
        
        // Sort episodes by season and episode number
        episodes.sort((a, b) => {
          if (a.season === b.season) {
            return (a.episodeNumber || 0) - (b.episodeNumber || 0);
          }
          return (a.season || 0) - (b.season || 0);
        });

        // Group episodes by season
        const episodesBySeason = {};
        episodes.forEach(episode => {
          const season = episode.season || 'Unknown';
          if (!episodesBySeason[season]) {
            episodesBySeason[season] = [];
          }
          episodesBySeason[season].push(episode);
        });

        series.episodes = episodes;
        series.episodesBySeason = episodesBySeason;
        series.seasonsCount = Object.keys(episodesBySeason).filter(s => s !== 'Unknown').length;
      } catch (error) {
        console.error(`Error fetching episodes for series ${series.title}:`, error);
        series.episodes = [];
        series.episodesBySeason = {};
        series.seasonsCount = 0;
      }
    }
    
    // Return the series data with appropriate caching headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Series-Slug': slug,
        'X-Series-Title': series.title || 'Unknown'
      },
      body: JSON.stringify(series)
    };
  } catch (error) {
    console.error('Error in series detail handler:', error);
    
    // Create a more detailed error response
    const errorResponse = {
      error: 'Internal Server Error',
      message: error.message,
      slug: slug,
      path: event.path,
      timestamp: new Date().toISOString()
    };
    
    // Log additional debugging information
    console.error('Error details:', JSON.stringify(errorResponse));
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};