const data = require('../../src/data/characters.json');
const { slugify } = require('../../src/utils/slugify.js');

exports.handler = async function(event, context) {
  const slug = event.path.replace(/^\/characters\/|\/$/g, '');
  const char = data.find(c => slugify(c.name) === slug);
  if (!char) {
    return { statusCode: 404, body: 'Not found' };
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