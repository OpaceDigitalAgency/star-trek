import { getAllSeries, getAllCharacters } from '../services/sitemapService';

export async function get() {
  const series = await getAllSeries();
  const characters = await getAllCharacters();
  
  return {
    body: generateSitemap(series, characters),
    headers: {
      'Content-Type': 'application/xml'
    }
  };
}

function generateSitemap(series, characters) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>https://star-trek-timelines.netlify.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://star-trek-timelines.netlify.app/series/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://star-trek-timelines.netlify.app/timeline/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://star-trek-timelines.netlify.app/characters/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://star-trek-timelines.netlify.app/about/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Series pages -->
  ${series.map(s => `
  <url>
    <loc>https://star-trek-timelines.netlify.app/series/${s.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Character pages -->
  ${characters.map(c => `
  <url>
    <loc>https://star-trek-timelines.netlify.app/characters/${c.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;
}