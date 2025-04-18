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
    // Get the slug from the path
    const slug = event.path.split('/').pop();
    
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
      console.error(`Series not found with slug: ${slug}. Available slugs: ${allSeries.map(s => s.slug || slugify(s.title)).join(', ')}`);
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Series not found',
          message: `No series found with slug or UID: ${slug}`,
          availableSlugs: allSeries.map(s => s.slug || slugify(s.title))
        })
      };
    }
    
    // Get episodes for this series if needed
    if (!series.episodes) {
      try {
        const response = await fetch(`${STAPI_BASE_URL}/episode/search?title=${encodeURIComponent(series.title)}&pageSize=100`);
        const data = await response.json();
        series.episodes = data.episodes || [];
      } catch (error) {
        console.error(`Error fetching episodes for series ${series.title}:`, error);
        series.episodes = [];
      }
    }
    
    // Return the series data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(series)
    };
  } catch (error) {
    console.error('Error in series detail handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};