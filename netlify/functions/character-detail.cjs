const data = require('../../src/data/characters.json');
const { slugify } = require('../../src/utils/slugify.cjs');
// We'll use dynamic import for node-fetch since it's an ES module

exports.handler = async function(event, context) {
  const slug = event.path.replace(/^\/characters\/|\/$/g, '');
  let char = data.find(c => slugify(c.name) === slug);

  // Fallback: If not found locally, try enrichment function
  if (!char) {
    // Try to reconstruct the name from the slug (replace dashes with spaces)
    const likelyName = slug.replace(/-/g, ' ');
    try {
      // Dynamically import node-fetch (ES module)
      const { default: fetch } = await import('node-fetch');
      
      const enrichmentUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/character-enrichment?name=${encodeURIComponent(likelyName)}`;
      const resp = await fetch(enrichmentUrl);
      if (resp.ok) {
        char = await resp.json();
      }
    } catch (e) {
      // Ignore fetch errors, will return 404 below if char is still not found
      console.error('Error fetching character enrichment:', e);
    }
  }

  if (!char) {
    return { statusCode: 404, body: 'Not found' };
  }

  // Ensure wikiImage is present if available (no-op if already present)
  if (!char.wikiImage && char.wikiImageUrl) {
    char.wikiImage = char.wikiImageUrl;
  }

  context.callbackWaitsForEmptyEventLoop = false;
  const { renderToString } = await import('astro/dist/runtime/server/index.js');
  const pageModule = await import('../../src/pages/characters/[slug].astro');
  const CharacterPage = pageModule.default;
  const html = await renderToString(CharacterPage, { character: char });
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'cache-control': 'public, max-age=0, s-maxage=86400'
    },
    body: html
  };
};