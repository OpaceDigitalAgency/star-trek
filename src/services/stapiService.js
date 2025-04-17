import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Set up proper path resolution for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const cachePath = join(__dirname, '../data/characters.json');

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
      
      // Helper function to check if an image URL is valid (not SVG or placeholder)
      const isValidImageUrl = (url) => {
        if (!url) return false;
        
        // Skip SVG images
        if (url.toLowerCase().endsWith('.svg')) return false;
        
        // Skip placeholder images
        if (url.toLowerCase().includes('placeholder')) return false;
        
        return true;
      };
      
      // Try to find the og:image meta tag first (usually the best quality)
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage && isValidImageUrl(ogImage)) {
        // Use the proxy for the image
        const cleanedUrl = this.cleanWikiaImageUrl(ogImage);
        return this.proxyImageUrl(cleanedUrl);
      }
      
      // Try to find the main image - look for infobox image
      const infoboxImage = $('.pi-image img').first();
      if (infoboxImage.length) {
        let src = infoboxImage.attr('src');
        if (src && isValidImageUrl(src)) {
          // Use the proxy for the image
          const cleanedUrl = this.cleanWikiaImageUrl(src);
          return this.proxyImageUrl(cleanedUrl);
        }
      }
      
      // Look for any image in the article content
      const contentImage = $('.mw-parser-output img').first();
      if (contentImage.length) {
        let src = contentImage.attr('src');
        if (src && isValidImageUrl(src)) {
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
        let imageUrl = this.extractMemoryAlphaImageWithParams(html);
        
        // If no valid image was found, fall back to the static image service
        if (!imageUrl) {
          imageUrl = this.getImageUrl(title, 'character');
        }
        
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
  },
  
  // Function to fetch all characters from STAPI (approximately 6,000 characters)
  async getAllCharacters() {
    try {
      // Check if we have a file cache first
      console.log('🔍  Cache check:', cachePath, 'exists=', fs.existsSync(cachePath));
      if (process.env.SKIP_CHAR_CACHE !== 'true' && fs.existsSync(cachePath)) {
        console.log('🟢  Using cached characters.json');
        return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }
      
      // If no file cache or SKIP_CHAR_CACHE=true, use in-memory cache
      console.log('🟡  Cache miss – crawling STAPI');
      const cacheKey = 'all_characters_v2'; // v2 to force refresh if needed
      return await this.getCachedData(cacheKey, async () => {
        const pageSize = 100;          // STAPI max allowed
        let pageNumber = 0;
        const full = [];
        const seenUids = new Set();  // For deduplication
        
        console.log(`Starting to fetch all characters from STAPI with pageSize=${pageSize}`);
        
        let totalPages = 0;
        let totalCharacters = 0;
      
        // Make sure we fetch at least 10 pages to get a good sample of characters
        const minPagesToFetch = 10;
        
        while (true) {
          console.log(`Fetching page ${pageNumber}...`);
          const response = await axios.get(
            `${BASE_URL}/character/search`,
            {
              params: {
                pageSize,
                pageNumber
                // includeCharacterSpecies parameter removed (deprecated)
              }
            }
          );
          
          const data = response.data;
          
          // Log pagination information
          if (pageNumber === 0) {
            totalPages = data.page?.totalPages || 0;
            totalCharacters = data.page?.totalElements || 0;
            console.log(`API reports ${totalCharacters} total characters across ${totalPages} pages`);
          }
      
          if (!data.characters?.length) {
            console.log(`No characters returned on page ${pageNumber}, stopping`);
            break;
          }
          
          console.log(`Received ${data.characters.length} characters on page ${pageNumber}`);
          
          // Add only unique characters based on UID
          let newCharactersCount = 0;
          const charactersToFetch = [];
          
          data.characters.forEach(character => {
            if (!seenUids.has(character.uid)) {
              seenUids.add(character.uid);
              
              // Ensure species data is properly structured
              if (character.characterSpecies && !Array.isArray(character.characterSpecies)) {
                character.characterSpecies = [character.characterSpecies];
              }
              if (character.species && !Array.isArray(character.species)) {
                character.species = [character.species];
              }
              
              // If characterSpecies is empty, mark for follow-up fetch
              if (!character.characterSpecies?.length) {
                charactersToFetch.push(character);
              }
              
              full.push(character);
              newCharactersCount++;
              
              // Debug species information
              const speciesInfo = character.characterSpecies?.length
                ? character.characterSpecies
                : (character.species?.length ? character.species : [{ name: 'Unknown' }]);
              
              // Log every 100th character for debugging
              if (full.length % 100 === 0) {
                console.log(`Character #${full.length}: ${character.name}, Species:`,
                  speciesInfo.map(s => s.name || 'Unknown').join(', '));
              }
            }
          });
          
          // Make follow-up calls for characters with missing species data
          if (charactersToFetch.length > 0) {
            console.log(`Making follow-up calls for ${charactersToFetch.length} characters with missing species data`);
            
            for (const character of charactersToFetch) {
              try {
                const detailResponse = await axios.get(`${BASE_URL}/character?uid=${character.uid}`);
                const detailData = detailResponse.data.character;
                
                if (detailData) {
                  // Copy species data from detailed response
                  if (detailData.characterSpecies?.length) {
                    character.characterSpecies = Array.isArray(detailData.characterSpecies)
                      ? detailData.characterSpecies
                      : [detailData.characterSpecies];
                  } else if (detailData.species?.length) {
                    character.species = Array.isArray(detailData.species)
                      ? detailData.species
                      : [detailData.species];
                  }
                }
              } catch (error) {
                console.error(`Error fetching details for character ${character.uid}:`, error.message);
              }
            }
          }
          
          console.log(`Added ${newCharactersCount} new unique characters from page ${pageNumber}`);
          
          pageNumber += 1;
          
          // Check if we've reached the last page according to API pagination
          // But ensure we fetch at least minPagesToFetch pages to get a good sample
          if (data.page && pageNumber >= data.page.totalPages && pageNumber >= minPagesToFetch) {
            console.log(`Reached last page (${pageNumber-1} of ${data.page.totalPages}), stopping`);
            break;
          }
          
          // Safety check to prevent infinite loops
          if (pageNumber > 100) {
            console.log(`Reached safety limit of 100 pages, stopping`);
            break;
          }
        }
        
        console.log(`Fetched ${full.length} unique characters from STAPI`);
        
        // Normalize and deduplicate species data
        full.forEach(character => {
          // Ensure both species arrays exist
          character.characterSpecies = character.characterSpecies || [];
          character.species = character.species || [];
          
          // Combine both arrays and deduplicate by uid
          const allSpecies = [...character.characterSpecies, ...character.species];
          const uniqueSpecies = [];
          const seenSpeciesUids = new Set();
          
          allSpecies.forEach(species => {
            if (species && species.uid && !seenSpeciesUids.has(species.uid)) {
              seenSpeciesUids.add(species.uid);
              uniqueSpecies.push(species);
            } else if (species && !species.uid) {
              // Handle species without uid (keep them)
              uniqueSpecies.push(species);
            }
          });
          
          // Update both arrays with the deduplicated data
          character.characterSpecies = uniqueSpecies;
          character.species = uniqueSpecies;
        });
        
        // Log species distribution for debugging
        const speciesCount = {};
        full.forEach(character => {
          const speciesList = character.characterSpecies?.length
            ? character.characterSpecies
            : (character.species?.length ? character.species : [{ name: 'Unknown' }]);
          
          speciesList.forEach(s => {
            const speciesName = s.name || 'Unknown';
            speciesCount[speciesName] = (speciesCount[speciesName] || 0) + 1;
          });
        });
        
        console.log('Species distribution:', Object.entries(speciesCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([name, count]) => `${name}: ${count}`)
          .join(', '));
        
        return full;
      }, 3600000); // Cache for 1 hour
    } catch (error) {
      console.error('Error in getAllCharacters:', error);
      console.error('Error details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      return [];
    }
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

// Function to get static image URL for a character
export function getStaticImage(uid) {
  return `https://static.stapi.co/character/${uid}.jpg`;
}