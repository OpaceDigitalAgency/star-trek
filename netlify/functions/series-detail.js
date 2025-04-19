// netlify/functions/series-detail.js - Ultra-Simplified for debugging
// Removed fs, path, node-fetch imports

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

    // This is the absolute minimum logging to check execution
    console.log(`[series-detail] DEBUG: Function reached execution start for slug: ${slug}`);

    // Return a hardcoded basic response
    const simplifiedSeriesData = {
        title: `Debug Series: ${slug}`,
        slug: slug,
        uid: 'DEBUG_UID',
        description: 'This is a simplified debug response.',
        episodes: [],
        cast: [],
        seasonsCount: 0,
        episodesCount: 0
    };

    console.log(`[series-detail] DEBUG: Returning hardcoded data for ${slug}`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Short cache for debugging
        'X-Series-Slug': slug,
        'X-Series-Title': simplifiedSeriesData.title
      },
      body: JSON.stringify(simplifiedSeriesData)
    };

  } catch (error) {
    // Log any errors that occur even in this simplified version
    console.error(`[series-detail] DEBUG: Unhandled error in simplified handler for slug ${slug}:`, error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache, no-store' },
      body: JSON.stringify({ error: 'Internal Server Error (Simplified)', message: error.message, slug: slug || 'Unknown' }),
    };
  }
};