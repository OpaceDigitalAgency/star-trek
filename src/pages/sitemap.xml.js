import { getAllSeries, getAllCharacters } from '../services/sitemapService';

export const prerender = false;

export async function GET() {
  const series = await getAllSeries();
  const characters = await getAllCharacters();
  
  return new Response(generateSitemap(series, characters), {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}

function generateSitemap(series, characters) {
  const baseUrl = 'https://star-trek-timelines.netlify.app';
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/series/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/timeline/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/characters/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Series pages -->
  ${series.map(s => `
  <url>
    <loc>${baseUrl}/series/${s.slug}/</loc>
    <lastmod>${s.lastmod || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Only include first 48 character pages in sitemap -->
  ${characters.slice(0, 48).map(c => `
  <url>
    <loc>${baseUrl}/characters/${c.slug}/</loc>
    <lastmod>${c.lastmod || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;
}