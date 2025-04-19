// netlify/functions/series-detail.js - Simplified for debugging
const fs = require('fs').promises;
const path = require('path');
// Removed node-fetch import for now

// Helper function to slugify text (kept for potential future use)
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

exports.handler = async (event) => {
  let slug;
  try {
    if (event.queryStringParameters && event.queryStringParameters.slug) {
      slug = event.queryStringParameters.slug;
    } else {
      const pathParts = event.path.split('/').filter(Boolean);
      slug = pathParts[pathParts.length - 1];
    }

    if (slug && slug.endsWith('/')) {
      slug = slug.slice(0, -1);
    }

    console.log(`[series-detail] DEBUG: Function triggered for slug: ${slug}`);
    console.log(`[series-detail] DEBUG: process.cwd(): ${process.cwd()}`);
    console.log(`[series-detail] DEBUG: __dirname: ${__dirname}`);


    // Load all series data from local JSON
    let allSeries = [];
    const seriesJsonPath = path.resolve(process.cwd(), 'src', 'data', 'series.json');
    console.log(`[series-detail] DEBUG: Attempting to load series data from: ${seriesJsonPath}`);
    try {
      const seriesData = await fs.readFile(seriesJsonPath, 'utf8');
      allSeries = JSON.parse(seriesData);
      console.log(`[series-detail] DEBUG: Successfully loaded ${allSeries.length} series from local JSON.`);
    } catch (error) {
      console.error(`[series-detail] DEBUG: Failed to load or parse local series data:`, error);
       return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
          body: JSON.stringify({ error: 'Configuration Error', message: `Failed to load required file: src/data/series.json`, details: error.message })
        };
    }

    // Find the series by slug
    let series = allSeries.find(s => {
      const seriesSlug = s.slug || slugify(s.title);
      return seriesSlug === slug; // Only match by slug for simplicity
    });

    if (!series) {
      console.warn(`[series-detail] DEBUG: Series not found locally with slug: ${slug}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ error: 'Series not found', message: `No series found locally with slug: ${slug}` })
      };
    }
    console.log(`[series-detail] DEBUG: Found series: ${series.title}`);

    // Return basic series data (episodes and cast will be empty for now)
    const simplifiedSeriesData = {
        ...series,
        episodes: [], // Empty episodes
        cast: [], // Empty cast
        seasonsCount: 0,
        episodesCount: 0
    };

    console.log(`[series-detail] DEBUG: Returning simplified data for ${series.title}`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Series-Slug': slug,
        'X-Series-Title': series.title || 'Unknown'
      },
      body: JSON.stringify(simplifiedSeriesData)
    };

  } catch (error) {
    console.error('[series-detail] DEBUG: Unhandled error in handler:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' },
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message, slug: slug || 'Unknown' }),
    };
  }
};