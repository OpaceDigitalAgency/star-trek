// netlify/functions/series-detail.js
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { slugify } = require('../../src/utils/slugify.cjs');

// Helper function to load local series data
const loadLocalSeriesData = () => {
  try {
    const seriesDataPath = path.join(__dirname, '../../src/data/series.json');
    const seriesData = JSON.parse(fs.readFileSync(seriesDataPath, 'utf8'));
    return seriesData;
  } catch (error) {
    console.error('[series-detail] Error loading local series data:', error);
    return [];
  }
};

// Helper function to load local series-characters data
const loadLocalSeriesCharactersData = () => {
  try {
    const seriesCharactersPath = path.join(__dirname, '../../src/data/series-characters.json');
    const seriesCharactersData = JSON.parse(fs.readFileSync(seriesCharactersPath, 'utf8'));
    return seriesCharactersData;
  } catch (error) {
    console.error('[series-detail] Error loading local series-characters data:', error);
    return {};
  }
};

exports.handler = async (event) => {
  let slug;
  try {
    // Extract slug from query parameters or path
    if (event.queryStringParameters && event.queryStringParameters.slug) {
      slug = event.queryStringParameters.slug;
    } else {
      const pathParts = event.path.split('/').filter(Boolean);
      slug = pathParts[pathParts.length - 1];
    }

    if (slug && slug.endsWith('/')) {
      slug = slug.slice(0, -1);
    }

    console.log(`[series-detail] Processing request for slug: ${slug}`);

    // Load local series data
    const allSeries = loadLocalSeriesData();
    
    // Find the series by slug or UID
    let seriesData = allSeries.find(s =>
      s.slug === slug ||
      s.uid === slug ||
      slugify(s.title) === slug
    );

    if (!seriesData) {
      console.log(`[series-detail] Series not found for slug: ${slug}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Series not found', slug })
      };
    }

    // Load series characters data
    const seriesCharacters = loadLocalSeriesCharactersData();
    
    // Try to find cast by UID first, then by slugified title
    let cast = seriesCharacters[seriesData.uid] || [];
    
    // If no cast found by UID, try by slugified title
    if (cast.length === 0) {
      const slugifiedTitle = slugify(seriesData.title);
      cast = seriesCharacters[slugifiedTitle] || [];
    }

    // Enhance series data with cast information
    seriesData = {
      ...seriesData,
      cast: cast,
      episodes: seriesData.episodes || [],
      slug: seriesData.slug || slugify(seriesData.title)
    };

    console.log(`[series-detail] Returning data for series: ${seriesData.title}`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Series-Slug': slug,
        'X-Series-Title': seriesData.title
      },
      body: JSON.stringify(seriesData)
    };

  } catch (error) {
    console.error(`[series-detail] Error processing request for slug ${slug}:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' },
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message, slug: slug || 'Unknown' }),
    };
  }
};