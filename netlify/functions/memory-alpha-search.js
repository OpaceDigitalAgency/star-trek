// Import fetch using dynamic import to support both ESM and CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  const query = event.queryStringParameters.query;
  
  if (!query) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing search query parameter' })
    };
  }

  try {
    // Use the MediaWiki API to search Memory Alpha
    const searchUrl = `https://memory-alpha.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.statusText}`);
    }
    const searchData = await searchResponse.json();
    
    // Get the first few results
    const results = searchData.query.search.slice(0, 5);
    
    // For each result, get the page info including images
    const enhancedResults = await Promise.all(results.map(async (result) => {
      const pageTitle = result.title;
      const pageUrl = `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
      
      // Fetch the page HTML to extract the og:image
      const pageResponse = await fetch(pageUrl);
      if (!pageResponse.ok) {
        return {
          title: pageTitle,
          snippet: result.snippet,
          url: pageUrl,
          imageUrl: null
        };
      }
      
      const pageHtml = await pageResponse.text();
      
      // Extract og:image URL
      const $ = cheerio.load(pageHtml);
      const ogImage = $('meta[property="og:image"]').attr('content');
      
      // Extract a brief summary from the first paragraph
      const firstParagraph = $('.mw-parser-output > p').first().text();
      
      return {
        title: pageTitle,
        snippet: result.snippet,
        summary: firstParagraph,
        url: pageUrl,
        imageUrl: ogImage ? `/api/proxy-image?url=${encodeURIComponent(ogImage)}` : null
      };
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(enhancedResults)
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error searching Memory Alpha',
        details: error.message
      })
    };
  }
};