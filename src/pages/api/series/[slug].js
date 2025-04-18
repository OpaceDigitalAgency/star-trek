import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

export const prerender = false;

export async function GET({ params }) {
  try {
    const { slug } = params;
    
    // Load series data from JSON file
    const seriesJsonPath = path.join(__dirname, '..', '..', '..', 'data', 'series.json');
    const seriesData = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
    
    // Load characters data
    const charactersJsonPath = path.join(__dirname, '..', '..', '..', 'data', 'characters.json');
    const charactersData = JSON.parse(fs.readFileSync(charactersJsonPath, 'utf8'));
    
    // Find the series by slug
    const series = seriesData.find(s => s.slug === slug);
    
    if (!series) {
      return new Response(JSON.stringify({
        error: 'Series not found',
        message: `No series found with slug: ${slug}`
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize cast array
    series.cast = [];

    // Fetch cast from STAPI
    try {
      const castMembers = [];

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

      // Get cast for the current series
      const seriesCastMembers = seriesCast[slug] || [];
      
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
      console.error('Error fetching cast:', error);
      series.cast = [];
    }

    // Fetch episodes from STAPI
    try {
      const response = await fetch(`${STAPI_BASE_URL}/episode/search?title=${encodeURIComponent(series.title)}&pageSize=100`);
      const data = await response.json();
      
      if (data.episodes) {
        // Sort episodes by season and episode number
        const episodes = data.episodes.map(episode => ({
          title: episode.title,
          season: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          airDate: episode.usAirDate,
          stardate: episode.stardateFrom
        })).sort((a, b) => {
          if (a.season === b.season) {
            return (a.episodeNumber || 0) - (b.episodeNumber || 0);
          }
          return (a.season || 0) - (b.season || 0);
        });

        series.episodes = episodes;
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
      series.episodes = [];
    }
    
    return new Response(JSON.stringify(series), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in series API:', error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}