// netlify/functions/series-detail.js
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Helper function to slugify text
function slugify(text) {
  if (!text) return ''; // Handle null or undefined input
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
  let slug; // Define slug outside try block for error reporting
  try {
    // Get the slug from the query parameters or path
    if (event.queryStringParameters && event.queryStringParameters.slug) {
      slug = event.queryStringParameters.slug;
    } else {
      const pathParts = event.path.split('/').filter(Boolean);
      slug = pathParts[pathParts.length - 1];
    }

    // Remove trailing slash if present
    if (slug && slug.endsWith('/')) {
      slug = slug.slice(0, -1);
    }

    console.log(`[series-detail] Processing request for slug: ${slug}`);

    // Load all series data from local JSON first
    let allSeries = [];
    const seriesJsonPath = path.resolve(__dirname, '..', '..', 'src', 'data', 'series.json'); // Path relative to function location
    console.log(`[series-detail] Attempting to load series data from: ${seriesJsonPath}`);
    try {
      if (fs.existsSync(seriesJsonPath)) {
        allSeries = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
        console.log(`[series-detail] Successfully loaded ${allSeries.length} series from local JSON.`);
      } else {
        console.error(`[series-detail] Local series data NOT FOUND at ${seriesJsonPath}. Cannot proceed without base series data.`);
        // Return 500 because this is a configuration error
         return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
            body: JSON.stringify({ error: 'Configuration Error', message: `Missing required file: src/data/series.json` })
          };
      }
    } catch (error) {
      console.error(`[series-detail] Failed to load or parse local series data from ${seriesJsonPath}:`, error);
      return { // Return 500 on parsing error
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ error: 'Internal Server Error', message: `Failed to parse src/data/series.json: ${error.message}` })
      };
    }

    // Find the series by slug or UID from the loaded local data
    let series = allSeries.find(s => {
      const seriesSlug = s.slug || slugify(s.title);
      return seriesSlug === slug || s.uid === slug;
    });

    // If not found in local data, return 404
    if (!series) {
      const availableSlugs = allSeries.map(s => s.slug || slugify(s.title));
      console.error(`[series-detail] Series not found locally with slug: ${slug}`);
      console.error(`[series-detail] Available local slugs: ${availableSlugs.join(', ')}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ error: 'Series not found', message: `No series found locally with slug or UID: ${slug}` })
      };
    }
    console.log(`[series-detail] Found series: ${series.title} (UID: ${series.uid || 'N/A'})`);

    // --- Fetch and organize episodes using Series UID ---
    let episodes = [];
    let seasonsCount = 0;

    if (series.uid) {
      try {
        console.log(`[series-detail] Fetching episodes for series UID ${series.uid}...`);
        const epResponse = await fetch(`${STAPI_BASE_URL}/series/${series.uid}/episodes?pageSize=500`);
        if (epResponse.ok) {
          const epData = await epResponse.json();
          episodes = epData.episodes || [];
          console.log(`[series-detail] Fetched ${episodes.length} episodes for series UID ${series.uid}.`);

          episodes.sort((a, b) => { // Sort correctly
            const seasonA = a.season?.seasonNumber ?? Infinity;
            const seasonB = b.season?.seasonNumber ?? Infinity;
            if (seasonA !== seasonB) return seasonA - seasonB;
            return (a.episodeNumber ?? Infinity) - (b.episodeNumber ?? Infinity);
          });

          const episodesBySeason = episodes.reduce((acc, ep) => { // Group for counting
            const seasonNum = ep.season?.seasonNumber;
            const key = (typeof seasonNum === 'number' && !isNaN(seasonNum)) ? String(seasonNum) : "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(ep);
            return acc;
          }, {});
          seasonsCount = Object.keys(episodesBySeason).filter(s => s !== 'Unknown').length;
          console.log(`[series-detail] Calculated ${seasonsCount} seasons for UID ${series.uid}.`);

        } else {
          console.error(`[series-detail] Failed to fetch episodes for series UID ${series.uid}: ${epResponse.status}`);
        }
      } catch (error) {
        console.error(`[series-detail] Error fetching episodes for series UID ${series.uid}:`, error);
      }
    } else {
      console.warn(`[series-detail] Cannot fetch episodes: Series UID is missing for ${series.title}`);
    }
    series.episodes = episodes;
    series.seasonsCount = seasonsCount;
    series.episodesCount = episodes.length;

    // --- Fetch Cast Data using Pre-built JSON ---
    let castMembers = [];
    const seriesCharactersPath = path.resolve(__dirname, 'series-characters.json'); // Assume it's bundled next to the function
    console.log(`[series-detail] Attempting to load series characters data from: ${seriesCharactersPath}`);
    try {
      let seriesCharactersData = {};
      if (fs.existsSync(seriesCharactersPath)) {
        try {
          seriesCharactersData = JSON.parse(fs.readFileSync(seriesCharactersPath, 'utf8'));
          console.log('[series-detail] Successfully loaded and parsed series-characters.json');
        } catch (e) {
          console.error('[series-detail] Error parsing series-characters.json:', e);
          // Don't fail entirely, just proceed with empty cast
        }
      } else {
         console.warn('[series-detail] series-characters.json not found at expected location:', seriesCharactersPath);
      }

      const seriesSlugForCast = series.slug || slugify(series.title);
      console.log(`[series-detail] Looking for cast key: ${seriesSlugForCast}`);

      if (seriesCharactersData[seriesSlugForCast] && seriesCharactersData[seriesSlugForCast].length > 0) {
         console.log(`[series-detail] Found pre-fetched character data for ${seriesSlugForCast}.`);
         castMembers = seriesCharactersData[seriesSlugForCast].map(char => ({
             name: char.name,
             uid: char.uid,
             image: char.image,
             url: char.url,
             performer: char.performer,
             characterLink: char.characterLink
         })).filter(c => c.uid); // Ensure UID is present
         console.log(`[series-detail] Loaded ${castMembers.length} cast members from pre-fetched data.`);
      } else {
         console.warn(`[series-detail] No pre-fetched character data found for ${seriesSlugForCast} in series-characters.json. Cast list will be empty.`);
      }
    } catch (error) {
      console.error(`[series-detail] Error processing cast for series ${series.title}:`, error);
    }
    series.cast = castMembers;
    console.log(`[series-detail] Final cast list size for ${series.title}: ${series.cast.length}`);

    // --- Return the series data ---
    console.log(`[series-detail] Returning data for ${series.title}. Episodes: ${series.episodes.length}, Cast: ${series.cast.length}`);
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
    console.error('[series-detail] Unhandled error in handler:', error);
    const errorResponse = {
      error: 'Internal Server Error',
      message: error.message,
      slug: slug || 'Unknown',
      path: event.path,
      timestamp: new Date().toISOString()
    };
    console.error('[series-detail] Error details:', JSON.stringify(errorResponse));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' },
      body: JSON.stringify(errorResponse)
    };
  }
};