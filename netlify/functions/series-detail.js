// netlify/functions/series-detail.js
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Helper function to slugify text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

exports.handler = async (event) => {
  try {
    // Get the slug from the query parameters or path
    let slug;
    
    // Check if slug is in query parameters
    if (event.queryStringParameters && event.queryStringParameters.slug) {
      slug = event.queryStringParameters.slug;
    } else {
      // Fallback to extracting from path
      const pathParts = event.path.split('/').filter(Boolean);
      slug = pathParts[pathParts.length - 1];
    }
    
    // Remove trailing slash if present
    if (slug && slug.endsWith('/')) {
      slug = slug.slice(0, -1);
    }
    
    console.log(`Processing series detail request for slug: ${slug}, original path: ${event.path}`);
    
    // Load all series data
    let allSeries = [];
    try {
      // Try to import the local series data
      const seriesJsonPath = path.join(__dirname, '..', '..', 'src', 'data', 'series.json');
      
      if (fs.existsSync(seriesJsonPath)) {
        allSeries = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
      } else {
        // Fallback to STAPI API if local data is not available
        const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
        const data = await response.json();
        allSeries = data.series || [];
      }
    } catch (error) {
      console.error('Failed to load series data:', error);
      // Fallback to STAPI API
      const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
      const data = await response.json();
      allSeries = data.series || [];
    }
    
    // Find the series by slug or UID
    let series = allSeries.find(s => {
      // Ensure we're using the same slug format consistently
      const seriesSlug = s.slug || slugify(s.title);
      return seriesSlug === slug || s.uid === slug;
    });
    
    // If not found, return 404 with more detailed error message
    if (!series) {
      // Get a list of available slugs for debugging
      const availableSlugs = allSeries.map(s => s.slug || slugify(s.title));
      
      console.error(`Series not found with slug: ${slug}`);
      console.error(`Available slugs: ${availableSlugs.join(', ')}`);
      
      // Check if there's a close match (for debugging purposes)
      const possibleMatches = availableSlugs.filter(s =>
        s.includes(slug) || slug.includes(s) ||
        s.toLowerCase() === slug.toLowerCase()
      );
      
      if (possibleMatches.length > 0) {
        console.error(`Possible matches found: ${possibleMatches.join(', ')}`);
      }
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          error: 'Series not found',
          message: `No series found with slug or UID: ${slug}`,
          availableSlugs: availableSlugs,
          possibleMatches: possibleMatches.length > 0 ? possibleMatches : undefined
        })
      };
    }
    
    // Get and organize episodes for this series
    if (!series.episodes) {
      try {
        const response = await fetch(`${STAPI_BASE_URL}/episode/search?title=${encodeURIComponent(series.title)}&pageSize=100`);
        const data = await response.json();
        const episodes = data.episodes || [];
        
        // Sort episodes by season and episode number
        episodes.sort((a, b) => {
          if (a.season === b.season) {
            return (a.episodeNumber || 0) - (b.episodeNumber || 0);
          }
          return (a.season || 0) - (b.season || 0);
        });

        // Group episodes by season
        const episodesBySeason = {};
        episodes.forEach(episode => {
          const season = episode.season || 'Unknown';
          if (!episodesBySeason[season]) {
            episodesBySeason[season] = [];
          }
          episodesBySeason[season].push(episode);
        });

        series.episodes = episodes;
        series.episodesBySeason = episodesBySeason;
        series.seasonsCount = Object.keys(episodesBySeason).filter(s => s !== 'Unknown').length;
      } catch (error) {
        console.error(`Error fetching episodes for series ${series.title}:`, error);
        series.episodes = [];
        series.episodesBySeason = {};
        series.seasonsCount = 0;
      }
    }
    
    // Add cast data for the series
    try {
      // Load characters data
      const charactersJsonPath = path.join(__dirname, '..', '..', 'src', 'data', 'characters.json');
      let charactersData = [];
      
      if (fs.existsSync(charactersJsonPath)) {
        charactersData = JSON.parse(fs.readFileSync(charactersJsonPath, 'utf8'));
      }
      
      // Define cast members for each series
      const seriesCast = {
        'star-trek-the-next-generation': [
          { name: 'Data', performer: 'Brent Spiner', search: c => c.name === 'Data' },
          { name: 'William Riker', performer: 'Jonathan Frakes', search: c => {
            const name = c.name.toLowerCase();
            return name.includes('william') && name.includes('riker') && !name.includes('thomas');
          }},
          { name: 'Jean-Luc Picard', performer: 'Patrick Stewart', search: c => c.name === 'Jean-Luc Picard' },
          { name: 'Geordi La Forge', performer: 'LeVar Burton', search: c => c.name.toLowerCase().includes('geordi') },
          { name: 'Worf', performer: 'Michael Dorn', search: c => c.name === 'Worf' },
          { name: 'Deanna Troi', performer: 'Marina Sirtis', search: c => c.name.toLowerCase().includes('troi') },
          { name: 'Beverly Crusher', performer: 'Gates McFadden', search: c => c.name === 'Beverly Crusher' },
          { name: 'Wesley Crusher', performer: 'Wil Wheaton', search: c => c.name === 'Wesley Crusher' },
          { name: 'Tasha Yar', performer: 'Denise Crosby', search: c => {
            const name = c.name.toLowerCase();
            return name.includes('natasha') || name.includes('tasha');
          }}
        ],
        'star-trek-deep-space-nine': [
          { name: 'Benjamin Sisko', performer: 'Avery Brooks', search: c => c.name.toLowerCase().includes('sisko') },
          { name: 'Kira Nerys', performer: 'Nana Visitor', search: c => c.name.toLowerCase().includes('kira') },
          { name: 'Odo', performer: 'René Auberjonois', search: c => c.name === 'Odo' },
          { name: 'Jadzia Dax', performer: 'Terry Farrell', search: c => c.name.toLowerCase().includes('jadzia') },
          { name: 'Julian Bashir', performer: 'Alexander Siddig', search: c => c.name.toLowerCase().includes('bashir') },
          { name: 'Miles O\'Brien', performer: 'Colm Meaney', search: c => c.name.toLowerCase().includes('o\'brien') },
          { name: 'Quark', performer: 'Armin Shimerman', search: c => c.name === 'Quark' },
          { name: 'Worf', performer: 'Michael Dorn', search: c => c.name === 'Worf' }
        ],
        'star-trek-voyager': [
          { name: 'Kathryn Janeway', performer: 'Kate Mulgrew', search: c => c.name.toLowerCase().includes('janeway') },
          { name: 'Chakotay', performer: 'Robert Beltran', search: c => c.name === 'Chakotay' },
          { name: 'Tuvok', performer: 'Tim Russ', search: c => c.name === 'Tuvok' },
          { name: 'B\'Elanna Torres', performer: 'Roxann Dawson', search: c => c.name.toLowerCase().includes('torres') },
          { name: 'Tom Paris', performer: 'Robert Duncan McNeill', search: c => c.name.toLowerCase().includes('paris') },
          { name: 'Harry Kim', performer: 'Garrett Wang', search: c => c.name.toLowerCase().includes('kim') },
          { name: 'The Doctor', performer: 'Robert Picardo', search: c => c.name === 'The Doctor' || c.name === 'Emergency Medical Hologram' },
          { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => c.name.toLowerCase().includes('seven') }
        ],
        'star-trek-enterprise': [
          { name: 'Jonathan Archer', performer: 'Scott Bakula', search: c => c.name.toLowerCase().includes('archer') },
          { name: 'T\'Pol', performer: 'Jolene Blalock', search: c => c.name.toLowerCase().includes('t\'pol') },
          { name: 'Charles Tucker III', performer: 'Connor Trinneer', search: c => c.name.toLowerCase().includes('tucker') },
          { name: 'Malcolm Reed', performer: 'Dominic Keating', search: c => c.name.toLowerCase().includes('reed') },
          { name: 'Hoshi Sato', performer: 'Linda Park', search: c => c.name.toLowerCase().includes('sato') },
          { name: 'Travis Mayweather', performer: 'Anthony Montgomery', search: c => c.name.toLowerCase().includes('mayweather') },
          { name: 'Phlox', performer: 'John Billingsley', search: c => c.name === 'Phlox' }
        ],
        'star-trek-discovery': [
          { name: 'Michael Burnham', performer: 'Sonequa Martin-Green', search: c => c.name.toLowerCase().includes('burnham') },
          { name: 'Saru', performer: 'Doug Jones', search: c => c.name === 'Saru' },
          { name: 'Paul Stamets', performer: 'Anthony Rapp', search: c => c.name.toLowerCase().includes('stamets') },
          { name: 'Sylvia Tilly', performer: 'Mary Wiseman', search: c => c.name.toLowerCase().includes('tilly') }
        ],
        'star-trek-picard': [
          { name: 'Jean-Luc Picard', performer: 'Patrick Stewart', search: c => c.name === 'Jean-Luc Picard' },
          { name: 'Raffi Musiker', performer: 'Michelle Hurd', search: c => c.name.toLowerCase().includes('raffi') },
          { name: 'Cristóbal Rios', performer: 'Santiago Cabrera', search: c => c.name.toLowerCase().includes('rios') },
          { name: 'Agnes Jurati', performer: 'Alison Pill', search: c => c.name.toLowerCase().includes('jurati') },
          { name: 'Elnor', performer: 'Evan Evagora', search: c => c.name === 'Elnor' },
          { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => c.name.toLowerCase().includes('seven') }
        ],
        'star-trek-lower-decks': [
          { name: 'Beckett Mariner', performer: 'Tawny Newsome', search: c => c.name.toLowerCase().includes('mariner') },
          { name: 'Brad Boimler', performer: 'Jack Quaid', search: c => c.name.toLowerCase().includes('boimler') },
          { name: 'D\'Vana Tendi', performer: 'Noël Wells', search: c => c.name.toLowerCase().includes('tendi') },
          { name: 'Sam Rutherford', performer: 'Eugene Cordero', search: c => c.name.toLowerCase().includes('rutherford') },
          { name: 'Carol Freeman', performer: 'Dawnn Lewis', search: c => c.name.toLowerCase().includes('freeman') },
          { name: 'Jack Ransom', performer: 'Jerry O\'Connell', search: c => c.name.toLowerCase().includes('ransom') }
        ]
      };
      
      const castMembers = [];
      
      // Get cast for the current series
      const seriesSlug = slug || slugify(series.title);
      const seriesCastMembers = seriesCast[seriesSlug] || [];
      
      // Find character data for each cast member
      for (const castMember of seriesCastMembers) {
        const char = charactersData.find(castMember.search);
        if (char?.wikiImage) {
          castMembers.push({
            name: castMember.name,
            image: char.wikiImage,
            url: char.wikiUrl,
            performer: castMember.performer
          });
          console.log(`Added ${castMember.name} to cast list`);
        }
      }
      
      // If no cast members were found, add some generic ones
      if (castMembers.length === 0 && series.title) {
        // Try to find characters with the series name in their description
        const seriesChars = charactersData.filter(c =>
          c.description && c.description.toLowerCase().includes(series.title.toLowerCase()) && c.wikiImage
        ).slice(0, 10); // Limit to 10 characters
        
        for (const char of seriesChars) {
          castMembers.push({
            name: char.name,
            image: char.wikiImage,
            url: char.wikiUrl,
            performer: 'Unknown'
          });
          console.log(`Added ${char.name} to cast list (generic)`);
        }
      }
      
      // Sort by performer name
      castMembers.sort((a, b) => a.performer.localeCompare(b.performer));
      series.cast = castMembers;
      
      console.log('Final cast list:', series.cast);
    } catch (error) {
      console.error('Error adding cast data:', error);
      series.cast = [];
    }
    
    // Return the series data with appropriate caching headers
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Series-Slug': slug,
        'X-Series-Title': series.title || 'Unknown'
      },
      body: JSON.stringify(series)
    };
  } catch (error) {
    console.error('Error in series detail handler:', error);
    
    // Create a more detailed error response
    const errorResponse = {
      error: 'Internal Server Error',
      message: error.message,
      slug: slug,
      path: event.path,
      timestamp: new Date().toISOString()
    };
    
    // Log additional debugging information
    console.error('Error details:', JSON.stringify(errorResponse));
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};