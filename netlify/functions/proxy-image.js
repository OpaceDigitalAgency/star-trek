// Import fetch using dynamic import to support ESM
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // Get the image URL from query parameters
  const imageUrl = event.queryStringParameters.url;
  
  if (!imageUrl) {
    return {
      statusCode: 400,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Missing image URL parameter' })
    };
  }

  // Validate URL to prevent abuse
  const allowedDomains = [
    'static.wikia.nocookie.net',
    'memory-alpha.fandom.com',
    'vignette.wikia.nocookie.net',
    'www.startrek.com',
    'images.startrek.com',
    'static.stapi.co'
  ];

  const isAllowed = allowedDomains.some(domain => imageUrl.includes(domain));
  
  if (!isAllowed) {
    return {
      statusCode: 403,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Domain not allowed' })
    };
  }

  try {
    // IMPORTANT: Don't remove query parameters - they're required for Wikia images
    // Only clean problematic segments if they're causing issues
    let cleanedUrl = imageUrl;
    
    // Make sure the URL has /revision/latest if it's from Wikia
    if (cleanedUrl.includes('static.wikia.nocookie.net') && !cleanedUrl.includes('/revision/latest')) {
      cleanedUrl = cleanedUrl.replace(/\/revision\/[^\/]+/g, '/revision/latest');
    }

    console.log(`Proxying image: ${cleanedUrl}`);

    // Fetch the image with proper headers
    const response = await fetch(cleanedUrl, {
      headers: {
        // Mimic a browser request
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        // CRITICAL: Use Memory Alpha as the referer to bypass referrer policy restrictions
        'Origin': 'https://memory-alpha.fandom.com',
        'Referer': 'https://memory-alpha.fandom.com/'
      }
    });

    if (!response.ok) {
      console.error(`Error fetching image: ${cleanedUrl}, status: ${response.status}`);
      
      // Try to determine what type of image this is based on the URL
      let fallbackImage = '/images/stars-placeholder.jpg';
      
      if (cleanedUrl.toLowerCase().includes('character') ||
          cleanedUrl.toLowerCase().includes('person') ||
          cleanedUrl.toLowerCase().includes('actor')) {
        fallbackImage = '/images/generic-character.jpg';
      } else if (cleanedUrl.toLowerCase().includes('ship') ||
                cleanedUrl.toLowerCase().includes('vessel') ||
                cleanedUrl.toLowerCase().includes('starship')) {
        fallbackImage = '/images/generic-ship.jpg';
      } else if (cleanedUrl.toLowerCase().includes('series') ||
                cleanedUrl.toLowerCase().includes('show')) {
        fallbackImage = '/images/stars-bg.jpg';
      }
      
      // If the image failed to load, return a fallback image
      return {
        statusCode: 307,
        headers: {
          ...headers,
          'Location': fallbackImage
        },
        body: ''
      };
    }

    // Get image data as buffer
    const buffer = await response.buffer();

    // Return the image with proper content type
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Try to determine what type of image this is based on the URL
    let fallbackImage = '/images/stars-placeholder.jpg';
    
    if (typeof cleanedUrl === 'string') {
      if (cleanedUrl.toLowerCase().includes('character') ||
          cleanedUrl.toLowerCase().includes('person') ||
          cleanedUrl.toLowerCase().includes('actor')) {
        fallbackImage = '/images/generic-character.jpg';
      } else if (cleanedUrl.toLowerCase().includes('ship') ||
                cleanedUrl.toLowerCase().includes('vessel') ||
                cleanedUrl.toLowerCase().includes('starship')) {
        fallbackImage = '/images/generic-ship.jpg';
      } else if (cleanedUrl.toLowerCase().includes('series') ||
                cleanedUrl.toLowerCase().includes('show')) {
        fallbackImage = '/images/stars-bg.jpg';
      }
    }
    
    // Return a fallback image instead of an error
    return {
      statusCode: 307,
      headers: {
        ...headers,
        'Location': fallbackImage
      },
      body: ''
    };
  }
};

export default handler;