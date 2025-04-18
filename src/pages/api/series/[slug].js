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

      // Data
      const dataChar = charactersData.find(c => c.name === 'Data');
      if (dataChar?.wikiImage) {
        castMembers.push({
          name: 'Data',
          image: dataChar.wikiImage,
          url: dataChar.wikiUrl,
          performer: 'Brent Spiner'
        });
        console.log('Added Data to cast list');
      }
      
      // William Riker
      const rikerChar = charactersData.find(c => {
        const name = c.name.toLowerCase();
        return name.includes('william') && name.includes('riker') && !name.includes('thomas');
      });
      if (rikerChar?.wikiImage) {
        castMembers.push({
          name: 'William Riker',
          image: rikerChar.wikiImage,
          url: rikerChar.wikiUrl,
          performer: 'Jonathan Frakes'
        });
        console.log('Added William Riker to cast list');
      }
      
      // Jean-Luc Picard
      const picardChar = charactersData.find(c => c.name === 'Jean-Luc Picard');
      if (picardChar?.wikiImage) {
        castMembers.push({
          name: 'Jean-Luc Picard',
          image: picardChar.wikiImage,
          url: picardChar.wikiUrl,
          performer: 'Patrick Stewart'
        });
        console.log('Added Jean-Luc Picard to cast list');
      }
      
      // Geordi La Forge
      const geordiChar = charactersData.find(c => c.name.toLowerCase().includes('geordi'));
      if (geordiChar?.wikiImage) {
        castMembers.push({
          name: 'Geordi La Forge',
          image: geordiChar.wikiImage,
          url: geordiChar.wikiUrl,
          performer: 'LeVar Burton'
        });
        console.log('Added Geordi La Forge to cast list');
      }
      
      // Worf
      const worfChar = charactersData.find(c => c.name === 'Worf');
      if (worfChar?.wikiImage) {
        castMembers.push({
          name: 'Worf',
          image: worfChar.wikiImage,
          url: worfChar.wikiUrl,
          performer: 'Michael Dorn'
        });
        console.log('Added Worf to cast list');
      }
      
      // Deanna Troi
      const troiChar = charactersData.find(c => c.name.toLowerCase().includes('troi'));
      if (troiChar?.wikiImage) {
        castMembers.push({
          name: 'Deanna Troi',
          image: troiChar.wikiImage,
          url: troiChar.wikiUrl,
          performer: 'Marina Sirtis'
        });
        console.log('Added Deanna Troi to cast list');
      }
      
      // Beverly Crusher
      const bevChar = charactersData.find(c => c.name === 'Beverly Crusher');
      if (bevChar?.wikiImage) {
        castMembers.push({
          name: 'Beverly Crusher',
          image: bevChar.wikiImage,
          url: bevChar.wikiUrl,
          performer: 'Gates McFadden'
        });
        console.log('Added Beverly Crusher to cast list');
      }
      
      // Wesley Crusher
      const wesleyChar = charactersData.find(c => c.name === 'Wesley Crusher');
      if (wesleyChar?.wikiImage) {
        castMembers.push({
          name: 'Wesley Crusher',
          image: wesleyChar.wikiImage,
          url: wesleyChar.wikiUrl,
          performer: 'Wil Wheaton'
        });
        console.log('Added Wesley Crusher to cast list');
      }
      
      // Tasha Yar
      const tashaChar = charactersData.find(c => {
        const name = c.name.toLowerCase();
        return name.includes('natasha') || name.includes('tasha');
      });
      if (tashaChar?.wikiImage) {
        castMembers.push({
          name: 'Tasha Yar',
          image: tashaChar.wikiImage,
          url: tashaChar.wikiUrl,
          performer: 'Denise Crosby'
        });
        console.log('Added Tasha Yar to cast list');
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