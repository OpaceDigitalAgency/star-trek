import { stapiService } from './stapiService';
import { slugify } from '../utils/slugify.js';
import charactersData from '../data/characters-local.json';

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
    // Use the local characters data file instead of making API calls
    // This allows us to include ALL characters in the sitemap
    const characters = charactersData;
    
    // Filter out characters without a name or UID
    const validCharacters = characters.filter(char => char.name && char.uid);
    
    // Map to the format we need for the sitemap
    // Use the same slug format as in the character pages (name-UID)
    return validCharacters.map(character => ({
      slug: `${slugify(character.name)}-${character.uid}`,
      name: character.name,
      lastmod: new Date().toISOString().split('T')[0] // Today's date for lastmod
    }));
  } catch (error) {
    console.error('Error processing characters for sitemap:', error);
    
    // Return fallback data for main characters
    return [
      { slug: 'james-t-kirk-CHMA0000001234', name: 'James T. Kirk', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'jean-luc-picard-CHMA0000005678', name: 'Jean-Luc Picard', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'benjamin-sisko-CHMA0000009012', name: 'Benjamin Sisko', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'kathryn-janeway-CHMA0000003456', name: 'Kathryn Janeway', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'spock-CHMA0000007890', name: 'Spock', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'data-CHMA0000002345', name: 'Data', lastmod: new Date().toISOString().split('T')[0] },
      { slug: 'worf-CHMA0000006789', name: 'Worf', lastmod: new Date().toISOString().split('T')[0] }
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