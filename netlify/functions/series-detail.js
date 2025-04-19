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

    console.log(`Processing series detail request for slug: ${slug}, original path: ${event.path}`);

    // Load all series data from local JSON first
    let allSeries = [];
    const seriesJsonPath = path.join(__dirname, '..', '..', 'src', 'data', 'series.json');
    try {
      if (fs.existsSync(seriesJsonPath)) {
        allSeries = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
      } else {
        console.warn(`Local series data not found at ${seriesJsonPath}. STAPI fallback not implemented here.`);
        // Consider adding STAPI fallback if needed, but local data is preferred
      }
    } catch (error) {
      console.error(`Failed to load or parse local series data from ${seriesJsonPath}:`, error);
      // Handle error appropriately, maybe return 500 or try STAPI
    }

    // Find the series by slug or UID from the loaded local data
    let series = allSeries.find(s => {
      const seriesSlug = s.slug || slugify(s.title);
      return seriesSlug === slug || s.uid === slug;
    });

    // If not found in local data, return 404
    if (!series) {
      const availableSlugs = allSeries.map(s => s.slug || slugify(s.title));
      console.error(`Series not found locally with slug: ${slug}`);
      console.error(`Available local slugs: ${availableSlugs.join(', ')}`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        body: JSON.stringify({ error: 'Series not found', message: `No series found locally with slug or UID: ${slug}` })
      };
    }

    // --- Fetch and organize episodes using Series UID ---
    let episodes = [];
    let seasonsCount = 0;

    if (series.uid) {
      try {
        console.log(`Fetching episodes for series UID ${series.uid}...`);
        const epResponse = await fetch(`${STAPI_BASE_URL}/series/${series.uid}/episodes?pageSize=500`); // Fetch up to 500 episodes
        if (epResponse.ok) {
          const epData = await epResponse.json();
          episodes = epData.episodes || [];
          console.log(`Fetched ${episodes.length} episodes for series UID ${series.uid}.`);

          // Sort episodes correctly by season number then episode number
          episodes.sort((a, b) => {
            const seasonA = a.season?.seasonNumber ?? Infinity;
            const seasonB = b.season?.seasonNumber ?? Infinity;
            if (seasonA !== seasonB) {
              return seasonA - seasonB;
            }
            return (a.episodeNumber ?? Infinity) - (b.episodeNumber ?? Infinity);
          });

          // Group episodes correctly by season number (for counting seasons)
          const episodesBySeason = episodes.reduce((acc, ep) => {
            const seasonNum = ep.season?.seasonNumber;
            const key = (typeof seasonNum === 'number' && !isNaN(seasonNum)) ? String(seasonNum) : "Unknown";
            if (!acc[key]) acc[key] = [];
            acc[key].push(ep);
            return acc;
          }, {});
          seasonsCount = Object.keys(episodesBySeason).filter(s => s !== 'Unknown').length;

        } else {
          console.error(`Failed to fetch episodes for series UID ${series.uid}: ${epResponse.status}`);
        }
      } catch (error) {
        console.error(`Error fetching episodes for series UID ${series.uid}:`, error);
      }
    } else {
      console.warn(`Cannot fetch episodes: Series UID is missing for ${series.title}`);
    }
    // Assign fetched/processed episodes to the series object
    series.episodes = episodes; // Full sorted list is needed by Astro component
    series.seasonsCount = seasonsCount; // Use calculated count
    series.episodesCount = episodes.length; // Update episode count based on fetch

    // --- Fetch Cast Data using Pre-built JSON ---
    let castMembers = [];
    try {
      // Prioritize loading pre-fetched series characters data
      // Correct path relative to the function file location
      const seriesCharactersPath = path.resolve(__dirname, 'series-characters.json');
      let seriesCharactersData = {};
      if (fs.existsSync(seriesCharactersPath)) {
        try {
          seriesCharactersData = JSON.parse(fs.readFileSync(seriesCharactersPath, 'utf8'));
          console.log('Loaded pre-fetched series characters data from series-characters.json');
        } catch (e) {
          console.error('Error parsing series-characters.json:', e);
        }
      } else {
         console.warn('series-characters.json not found at expected location:', seriesCharactersPath);
      }

      const seriesSlugForCast = series.slug || slugify(series.title); // Use consistent slug from found series
      if (seriesCharactersData[seriesSlugForCast] && seriesCharactersData[seriesSlugForCast].length > 0) {
         console.log(`Using pre-fetched character data for ${seriesSlugForCast}`);
         castMembers = seriesCharactersData[seriesSlugForCast].map(char => ({
             name: char.name,
             uid: char.uid, // Crucial for image path
             image: char.image, // May be pre-cached path or original URL
             url: char.url, // Memory Alpha URL
             performer: char.performer,
             characterLink: char.characterLink // Link to character page if generated
         })).filter(c => c.uid); // Ensure UID is present
         console.log(`Loaded ${castMembers.length} cast members from pre-fetched data.`);

      } else {
         console.warn(`No pre-fetched character data found for ${seriesSlugForCast} in series-characters.json. Cast list will be empty.`);
         // Relying on the build step that creates series-characters.json is preferred.
      }

    } catch (error) {
      console.error(`Error processing cast for series ${series.title}:`, error);
    }
    // Assign fetched cast
    series.cast = castMembers;
    console.log(`Final cast list size: ${series.cast.length}`);


    // --- Return the series data ---
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Series-Slug': slug,
        'X-Series-Title': series.title || 'Unknown'
      },
      body: JSON.stringify(series) // Return the modified series object
    };
  } catch (error) {
    console.error('Error in series detail handler:', error);
    const errorResponse = {
      error: 'Internal Server Error',
      message: error.message,
      slug: slug || 'Unknown', // Use slug if available
      path: event.path,
      timestamp: new Date().toISOString()
    };
    console.error('Error details:', JSON.stringify(errorResponse));
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' },
      body: JSON.stringify(errorResponse)
    };
  }
};