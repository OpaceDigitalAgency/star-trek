import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://stapi.co/api/v1/rest';
const MEMORY_ALPHA_API = 'https://memory-alpha.fandom.com/api.php';

// Main API service for Star Trek API (STAPI)
export const stapiService = {
  // Fetch all series
  async getSeries() {
    try {
      const response = await axios.get(`${BASE_URL}/series/search?pageSize=100`);
      return response.data.series || [];
    } catch (error) {
      console.error('Error fetching series:', error);
      return [];
    }
  },
  
  // Get a specific series by UID
  async getSeriesByUid(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/series?uid=${uid}`);
      return response.data.series || null;
    } catch (error) {
      console.error(`Error fetching series with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Fetch characters with pagination
  async getCharacters(page = 0, pageSize = 20) {
    try {
      const response = await axios.get(`${BASE_URL}/character/search`, {
        params: {
          pageNumber: page,
          pageSize: pageSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching characters:', error);
      return { characters: [], page: { totalPages: 1 } };
    }
  },
  
  // Get a specific character by UID
  async getCharacterByUid(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/character?uid=${uid}`);
      return response.data.character || null;
    } catch (error) {
      console.error(`Error fetching character with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for specific characters
  async searchCharacters(name) {
    try {
      const response = await axios.get(`${BASE_URL}/character/search`, {
        params: {
          name,
          pageSize: 10
        }
      });
      return response.data.characters || [];
    } catch (error) {
      console.error(`Error searching characters with name ${name}:`, error);
      return [];
    }
  },
  
  // Get episodes for a specific series
  async getEpisodesBySeries(seriesTitle) {
    try {
      const response = await axios.get(`${BASE_URL}/episode/search`, {
        params: {
          title: seriesTitle,
          pageSize: 100
        }
      });
      return response.data.episodes || [];
    } catch (error) {
      console.error(`Error fetching episodes for series ${seriesTitle}:`, error);
      return [];
    }
  },
  
  // Get a specific episode by UID
  async getEpisodeByUid(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/episode?uid=${uid}`);
      return response.data.episode || null;
    } catch (error) {
      console.error(`Error fetching episode with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for episodes with specific criteria
  async searchEpisodes(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/episode/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.episodes || [];
    } catch (error) {
      console.error('Error searching episodes:', error);
      return [];
    }
  },
  
  // Get spacecraft information (starships)
  async getSpacecraft(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/spacecraft?uid=${uid}`);
      return response.data.spacecraft || null;
    } catch (error) {
      console.error(`Error fetching spacecraft with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for spacecraft
  async searchSpacecraft(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/spacecraft/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.spacecrafts || [];
    } catch (error) {
      console.error('Error searching spacecraft:', error);
      return [];
    }
  },
  
  // Get information about species
  async getSpecies(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/species?uid=${uid}`);
      return response.data.species || null;
    } catch (error) {
      console.error(`Error fetching species with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for species
  async searchSpecies(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/species/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.species || [];
    } catch (error) {
      console.error('Error searching species:', error);
      return [];
    }
  },
  
  // Get information about astronomical objects (planets, stars, etc.)
  async getAstronomicalObject(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/astronomicalObject?uid=${uid}`);
      return response.data.astronomicalObject || null;
    } catch (error) {
      console.error(`Error fetching astronomical object with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for astronomical objects
  async searchAstronomicalObjects(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/astronomicalObject/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.astronomicalObjects || [];
    } catch (error) {
      console.error('Error searching astronomical objects:', error);
      return [];
    }
  },
  
  // Get information about movies
  async getMovie(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/movie?uid=${uid}`);
      return response.data.movie || null;
    } catch (error) {
      console.error(`Error fetching movie with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for movies
  async searchMovies(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/movie/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.movies || [];
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  },
  
  // Get information about organizations (Starfleet, Klingon Empire, etc.)
  async getOrganization(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/organization?uid=${uid}`);
      return response.data.organization || null;
    } catch (error) {
      console.error(`Error fetching organization with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for organizations
  async searchOrganizations(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/organization/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.organizations || [];
    } catch (error) {
      console.error('Error searching organizations:', error);
      return [];
    }
  },
  
  // Get information about technology
  async getTechnology(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/technology?uid=${uid}`);
      return response.data.technology || null;
    } catch (error) {
      console.error(`Error fetching technology with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for technology
  async searchTechnology(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/technology/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.technologyList || [];
    } catch (error) {
      console.error('Error searching technology:', error);
      return [];
    }
  },
  
  // Get information about weapons
  async getWeapon(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/weapon?uid=${uid}`);
      return response.data.weapon || null;
    } catch (error) {
      console.error(`Error fetching weapon with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for weapons
  async searchWeapons(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/weapon/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.weapons || [];
    } catch (error) {
      console.error('Error searching weapons:', error);
      return [];
    }
  },
  
  // Get information about conflicts (wars, battles, etc.)
  async getConflict(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/conflict?uid=${uid}`);
      return response.data.conflict || null;
    } catch (error) {
      console.error(`Error fetching conflict with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for conflicts
  async searchConflicts(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/conflict/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.conflicts || [];
    } catch (error) {
      console.error('Error searching conflicts:', error);
      return [];
    }
  },
  
  // Get seasons information
  async getSeason(uid) {
    try {
      const response = await axios.get(`${BASE_URL}/season?uid=${uid}`);
      return response.data.season || null;
    } catch (error) {
      console.error(`Error fetching season with UID ${uid}:`, error);
      return null;
    }
  },
  
  // Search for seasons
  async searchSeasons(criteria = {}) {
    try {
      const response = await axios.get(`${BASE_URL}/season/search`, {
        params: {
          ...criteria,
          pageSize: criteria.pageSize || 20
        }
      });
      return response.data.seasons || [];
    } catch (error) {
      console.error('Error searching seasons:', error);
      return [];
    }
  },
  
  // Memory Alpha Methods

  // Get HTML content from Memory Alpha
  async getMemoryAlphaPageHTML(pageName) {
    try {
      const url = `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(pageName)}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Memory Alpha page HTML for ${pageName}:`, error);
      return null;
    }
  },
  
  // Parse Memory Alpha HTML to extract image URL with proper parameters
  extractMemoryAlphaImageWithParams(html) {
    try {
      if (!html) return null;
      
      const $ = cheerio.load(html);
      
      // Try to find the og:image meta tag first (usually the best quality)
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        // Use the proxy for the image
        const cleanedUrl = this.cleanWikiaImageUrl(ogImage);
        return this.proxyImageUrl(cleanedUrl);
      }
      
      // Try to find the main image - look for infobox image
      const infoboxImage = $('.pi-image img').first();
      if (infoboxImage.length) {
        let src = infoboxImage.attr('src');
        if (src) {
          // Use the proxy for the image
          const cleanedUrl = this.cleanWikiaImageUrl(src);
          return this.proxyImageUrl(cleanedUrl);
        }
      }
      
      // Look for any image in the article content
      const contentImage = $('.mw-parser-output img').first();
      if (contentImage.length) {
        let src = contentImage.attr('src');
        if (src) {
          // Use the proxy for the image
          const cleanedUrl = this.cleanWikiaImageUrl(src);
          return this.proxyImageUrl(cleanedUrl);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Memory Alpha image:', error);
      return null;
    }
  },
  
  // Clean Wikia image URLs by removing problematic segments
  cleanWikiaImageUrl(url) {
    if (!url) return null;
    
    try {
      // IMPORTANT: Don't modify the URL too much - Wikia URLs need specific formats
      
      // Make sure the URL has /revision/latest if it's from Wikia
      if (url.includes('static.wikia.nocookie.net') && !url.includes('/revision/latest')) {
        url = url.replace(/\/revision\/[^\/]+/g, '/revision/latest');
      }
      
      // CRITICAL: DO NOT remove query parameters - they're required for Wikia images
      // DO NOT split on ? or remove cb and path-prefix parameters
      
      // Ensure we have a clean URL path
      return url;
    } catch (error) {
      console.error('Error cleaning Wikia image URL:', error);
      return url; // Return original URL if there's an error
    }
  },
  
  // Proxy image URL through our Netlify function
  proxyImageUrl(url) {
    if (!url) return null;
    
    // IMPORTANT: Always use the direct Netlify function path
    // The redirect from /api/proxy-image to /.netlify/functions/proxy-image
    // might not be working correctly on Netlify
    const proxyPath = '/.netlify/functions/proxy-image';
    
    // Return the proxied URL
    return `${proxyPath}?url=${encodeURIComponent(url)}`;
  },
  
  // Combined method to get Memory Alpha content with proper image URL
  async getMemoryAlphaContent(title) {
    try {
      // Use cache to avoid redundant requests
      const cacheKey = `memoryAlpha_${title.replace(/\s+/g, '_')}`;
      return await this.getCachedData(cacheKey, async () => {
        const pageName = title.replace(/\s+/g, '_');
        
        // Get the page HTML
        const html = await this.getMemoryAlphaPageHTML(pageName);
        if (!html) {
          throw new Error(`Failed to fetch HTML for ${pageName}`);
        }
        
        // Extract information from the page
        const $ = cheerio.load(html);
        
        // Extract summary text (first paragraph or two)
        let summary = '';
        $('.mw-parser-output > p').each((i, el) => {
          if (i < 2 && $(el).text().trim().length > 0) {
            summary += $(el).html();
          }
        });
        
        // Extract the image
        const imageUrl = this.extractMemoryAlphaImageWithParams(html);
        
        return {
          title: title,
          summary: summary || null,
          image: imageUrl,
          wikiUrl: `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(pageName)}`
        };
      });
    } catch (error) {
      console.error(`Error fetching Memory Alpha content for ${title}:`, error);
      return {
        title: title,
        summary: null,
        image: null,
        wikiUrl: `https://memory-alpha.fandom.com/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`
      };
    }
  },
  
  // Helper method to get reliable image URLs with fallbacks
  getImageUrl(name, type = 'character') {
    // This is a fallback method only when Memory Alpha images aren't available
    
    // First try Memory Alpha via the search function if possible
    
    // Only if Memory Alpha fails, use these fallbacks
    if (type === 'series') {
      // Memory Alpha pages for Star Trek series
      const seriesMapping = {
        'The Original Series': 'Star_Trek:_The_Original_Series',
        'TOS': 'Star_Trek:_The_Original_Series',
        'The Next Generation': 'Star_Trek:_The_Next_Generation',
        'TNG': 'Star_Trek:_The_Next_Generation',
        'Deep Space Nine': 'Star_Trek:_Deep_Space_Nine',
        'DS9': 'Star_Trek:_Deep_Space_Nine',
        'Voyager': 'Star_Trek:_Voyager',
        'VOY': 'Star_Trek:_Voyager',
        'Enterprise': 'Star_Trek:_Enterprise',
        'ENT': 'Star_Trek:_Enterprise',
        'Discovery': 'Star_Trek:_Discovery',
        'DISC': 'Star_Trek:_Discovery',
        'Picard': 'Star_Trek:_Picard',
        'PIC': 'Star_Trek:_Picard',
        'The Animated Series': 'Star_Trek:_The_Animated_Series',
        'TAS': 'Star_Trek:_The_Animated_Series',
        'Strange New Worlds': 'Star_Trek:_Strange_New_Worlds',
        'SNW': 'Star_Trek:_Strange_New_Worlds',
        'Lower Decks': 'Star_Trek:_Lower_Decks',
        'LD': 'Star_Trek:_Lower_Decks'
      };
      
      // Construct Memory Alpha URL
      if (name && seriesMapping[name]) {
        const seriesKey = seriesMapping[name].toLowerCase()
          .replace(/^star_trek:_/, '')
          .replace(/_/g, '-');
        return `/images/placeholder-${seriesKey}.jpg`;
      }
      
      return '/images/stars-placeholder.jpg';
    }
    
    // For Characters
    if (type === 'character') {
      const characterMapping = {
        'Kirk': 'James_T._Kirk',
        'James T. Kirk': 'James_T._Kirk',
        'Picard': 'Jean-Luc_Picard',
        'Jean-Luc Picard': 'Jean-Luc_Picard',
        'Sisko': 'Benjamin_Sisko',
        'Benjamin Sisko': 'Benjamin_Sisko',
        'Janeway': 'Kathryn_Janeway',
        'Kathryn Janeway': 'Kathryn_Janeway',
        'Spock': 'Spock',
        'Data': 'Data',
        'Worf': 'Worf',
        'Seven of Nine': 'Seven_of_Nine'
      };
      
      if (name && characterMapping[name]) {
        const charKey = name.toLowerCase().replace(/\s+/g, '-');
        return `/images/${charKey}-placeholder.jpg`;
      }
      
      return '/images/generic-character.jpg';
    }
    
    // Fallback image for any other type
    return '/images/stars-placeholder.jpg';
  },
  
  // Cache data locally to improve performance
  _cache: {},
  
  async getCachedData(key, fetchFunction, ttl = 3600000) { // Default TTL: 1 hour
    // Check if data exists in cache and is not expired
    if (this._cache[key] && this._cache[key].timestamp + ttl > Date.now()) {
      return this._cache[key].data;
    }
    
    // Fetch fresh data
    const data = await fetchFunction();
    
    // Store in cache
    this._cache[key] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  },
  
  // Utility function to clear cache
  clearCache() {
    this._cache = {};
  }
};

// Helper function to extract real-world years from production dates
export const extractYears = (series) => {
  if (!series || !series.productionStartYear) return 'Unknown';
  
  const start = series.productionStartYear;
  const end = series.productionEndYear || 'Present';
  
  return `${start}-${end}`;
};

// Helper function to extract in-universe years
export const extractStardateYears = (series) => {
  if (!series) return 'Unknown';
  
  // Try to parse from the series title and other data
  if (series.title) {
    if (series.title.includes('Original')) return '2265-2269';
    if (series.title.includes('Next Generation')) return '2364-2370';
    if (series.title.includes('Deep Space Nine')) return '2369-2375';
    if (series.title.includes('Voyager')) return '2371-2378';
    if (series.title.includes('Enterprise')) return '2151-2155';
    if (series.title.includes('Discovery')) return '2255-2258, 3188-3190';
    if (series.title.includes('Picard')) return '2399-2401';
    if (series.title.includes('Animated')) return '2269-2270';
    if (series.title.includes('Strange New Worlds')) return '2259-2263';
    if (series.title.includes('Lower Decks')) return '2380-2382';
  }
  
  return 'Unknown';
};

// Helper function to format stardate from episode data
export const formatStardate = (stardate) => {
  if (!stardate) return 'Unknown';
  
  // Format the stardate to standard Star Trek format if needed
  if (typeof stardate === 'number') {
    return stardate.toFixed(1);
  }
  
  return stardate;
};

// Helper to get the correct era for a given year
export const getEraFromYear = (year) => {
  if (!year || isNaN(parseInt(year))) return 'Unknown';
  
  const numYear = parseInt(year);
  
  if (numYear >= 2063 && numYear <= 2161) return 'Pre-Federation Era';
  if (numYear >= 2162 && numYear <= 2232) return 'Early Federation';
  if (numYear >= 2233 && numYear <= 2293) return 'Constitution-Class Era';
  if (numYear >= 2294 && numYear <= 2363) return 'Mid Federation Era';
  if (numYear >= 2364 && numYear <= 2379) return 'Galaxy-Class Era';
  if (numYear >= 2380 && numYear <= 2401) return 'Post-Nemesis Era';
  if (numYear >= 3000) return '32nd Century';
  
  return 'Unknown Era';
};

// Function to fetch all characters from STAPI (approximately 6,000 characters)
export async function getAllCharacters() {
  const pageSize = 100;          // STAPI max allowed
  let pageNumber = 0;
  const full = [];

  while (true) {
    const { data } = await axios.get(
      `${BASE_URL}/character/search`,
      { params: { pageSize, pageNumber } }
    );

    if (!data.characters?.length) break;
    full.push(...data.characters);
    pageNumber += 1;
  }
  return full;
}