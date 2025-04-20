// Import fetch using dynamic import to support ESM
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export async function get({ request }) {
  // Get the URL from the query parameters
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response(JSON.stringify({ error: 'Missing image URL parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
    return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
      
      // If the image failed to load, redirect to a fallback image
      return new Response('', {
        status: 307,
        headers: {
          'Location': fallbackImage
        }
      });
    }

    // Get image data as buffer
    const buffer = await response.arrayBuffer();

    // Return the image with proper content type
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
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
    return new Response('', {
      status: 307,
      headers: {
        'Location': fallbackImage
      }
    });
  }
}