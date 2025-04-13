import { stapiService } from './stapiService';

// Get all series for the sitemap
export async function getAllSeries() {
  try {
    // Fetch from STAPI
    const allSeries = await stapiService.getSeries();
    
    // Map to the format we need for the sitemap
    return allSeries.map(series => ({
      slug: series.uid || makeSlug(series.title),
      title: series.title,
      lastmod: new Date().toISOString().split('T')[0] // Today's date for lastmod
    }));
  } catch (error) {
    console.error('Error fetching series for sitemap:', error);
    
    // Return fallback data
    return [
      { slug: 'the-original-series', title: 'Star Trek: The Original Series', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'the-next-generation', title: 'Star Trek: The Next Generation', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'deep-space-nine', title: 'Star Trek: Deep Space Nine', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'voyager', title: 'Star Trek: Voyager', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'enterprise', title: 'Star Trek: Enterprise', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'discovery', title: 'Star Trek: Discovery', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'picard', title: 'Star Trek: Picard', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'the-animated-series', title: 'Star Trek: The Animated Series', lastmod: new Date().toISOString().split('T')[0] }
    ];
  }
}

// Get all characters for the sitemap
export async function getAllCharacters() {
  try {
    // Fetch a reasonable number of characters for the sitemap
    const response = await stapiService.getCharacters(0, 50);
    
    // Map to the format we need for the sitemap
    return response.characters.map(character => ({
      slug: character.uid || makeSlug(character.name),
      name: character.name,
      lastmod: new Date().toISOString().split('T')[0] // Today's date for lastmod
    }));
  } catch (error) {
    console.error('Error fetching characters for sitemap:', error);
    
    // Return fallback data for main characters
    return [
      { slug: 'james-kirk', name: 'James T. Kirk', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'jean-luc-picard', name: 'Jean-Luc Picard', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'benjamin-sisko', name: 'Benjamin Sisko', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'kathryn-janeway', name: 'Kathryn Janeway', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'spock', name: 'Spock', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'data', name: 'Data', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'worf', name: 'Worf', lastmod: new Date().toISOString().split('T')[0] }
    ];
  }
}

// Helper function to create slugs
function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}