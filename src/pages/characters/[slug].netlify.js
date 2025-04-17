import data from '../../data/characters.json';
import { slugify } from '../../utils/slugify.js';
import CharacterPage from './[slug].astro';
import { renderToString } from 'astro/runtime/server';

export async function onRequest({ params, setHeaders }) {
  const char = data.find((c) => slugify(c.name) === params.slug);
  if (!char) {
    return new Response('Not found', { status: 404 });
  }
  setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=86400' });
  const html = await renderToString(CharacterPage, { character: char });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}