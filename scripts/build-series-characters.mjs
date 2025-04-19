#!/usr/bin/env node

/**
 * This script builds a cache of character data for each Star Trek series from STAPI API.
 * It fetches characters for each series, filters to get the most relevant ones,
 * and uses existing character data and cached images from the characters.json file.
 * The result is saved to be used by the series detail page.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { slugify } from '../src/utils/slugify.js';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define paths
const seriesJsonPath = path.join(__dirname, '..', 'src', 'data', 'series.json');
const charactersJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters.json');
const charactersLocalJsonPath = path.join(__dirname, '..', 'src', 'data', 'characters-local.json');
const seriesCharactersPath = path.join(__dirname, '..', 'netlify', 'functions', 'series-characters.json');

// STAPI API base URL
const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

// Helper function to get characters for a series from STAPI
async function getCharactersForSeries(seriesTitle) {
  try {
    console.log(`Fetching characters for ${seriesTitle}...`);
    
    // First, get the series UID
    const seriesResponse = await axios.get(`${STAPI_BASE_URL}/series/search`, {
      params: {
        title: seriesTitle,
        pageSize: 1
      }
    });
    
    const series = seriesResponse.data.series?.[0];
    if (!series) {
      console.error(`Series not found: ${seriesTitle}`);
      return [];
    }
    
    // Get characters for this series
    const charactersResponse = await axios.get(`${STAPI_BASE_URL}/character/search`, {
      params: {
        pageSize: 100,
        pageNumber: 0
      }
    });
    
    let characters = charactersResponse.data.characters || [];
    
    // Filter characters to those who appeared in this series
    characters = characters.filter(character => {
      // Check if the character has episodes in this series
      return character.episodes?.some(episode =>
        episode.series?.uid === series.uid
      );
    });
    
    // Sort by number of episodes (most appearances first)
    characters.sort((a, b) => {
      const aEpisodes = a.episodes?.filter(ep => ep.series?.uid === series.uid)?.length || 0;
      const bEpisodes = b.episodes?.filter(ep => ep.series?.uid === series.uid)?.length || 0;
      return bEpisodes - aEpisodes;
    });
    
    // Take the top characters (main cast)
    const mainCast = characters.slice(0, 20);
    
    console.log(`Found ${mainCast.length} main characters for ${seriesTitle}`);
    return mainCast;
  } catch (error) {
    console.error(`Error fetching characters for series ${seriesTitle}:`, error);
    return [];
  }
}

// Main function to build the series characters cache
async function buildSeriesCharactersCache() {
  try {
    console.log('Building series characters cache...');
    
    // Load series data
    const seriesData = JSON.parse(await fs.readFile(seriesJsonPath, 'utf8'));
    
    // Load existing characters data for enrichment
    let charactersData = [];
    try {
      charactersData = JSON.parse(await fs.readFile(charactersJsonPath, 'utf8'));
      console.log(`Loaded ${charactersData.length} characters from characters.json`);
    } catch (error) {
      console.error('Error loading characters.json:', error);
    }
    
    // Load local characters data with cached images
    let localCharactersData = [];
    try {
      localCharactersData = JSON.parse(await fs.readFile(charactersLocalJsonPath, 'utf8'));
      console.log(`Loaded ${localCharactersData.length} characters from characters-local.json`);
    } catch (error) {
      console.error('Error loading characters-local.json:', error);
    }
    
    // Create an object to store characters for each series
    const seriesCharacters = {};
    
    // Define cast members for each series (based on Google Knowledge Graph and Memory Alpha data)
    const seriesCast = {
      'star-trek-the-next-generation': [
        { name: 'Jean-Luc Picard', performer: 'Patrick Stewart', search: c => c.name === 'Jean-Luc Picard' },
        { name: 'William T. Riker', performer: 'Jonathan Frakes', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('william') && name.includes('riker') && !name.includes('thomas');
        }},
        { name: 'Data', performer: 'Brent Spiner', search: c => c.name === 'Data' },
        { name: 'Deanna Troi', performer: 'Marina Sirtis', search: c => c.name.toLowerCase().includes('troi') },
        { name: 'Worf', performer: 'Michael Dorn', search: c => c.name === 'Worf' },
        { name: 'Beverly Crusher', performer: 'Gates McFadden', search: c => c.name === 'Beverly Crusher' },
        { name: 'Geordi La Forge', performer: 'LeVar Burton', search: c => c.name.toLowerCase().includes('geordi') },
        { name: 'Wesley Crusher', performer: 'Wil Wheaton', search: c => c.name === 'Wesley Crusher' },
        { name: 'Tasha Yar', performer: 'Denise Crosby', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('natasha') || name.includes('tasha');
        }},
        { name: 'Guinan', performer: 'Whoopi Goldberg', search: c => c.name === 'Guinan' },
        { name: 'Q', performer: 'John de Lancie', search: c => c.name === 'Q' },
        { name: 'Lwaxana Troi', performer: 'Majel Barrett', search: c => c.name.toLowerCase().includes('lwaxana') }
      ],
      'star-trek-deep-space-nine': [
        { name: 'Benjamin Sisko', performer: 'Avery Brooks', search: c => c.name.toLowerCase().includes('sisko') },
        { name: 'Kira Nerys', performer: 'Nana Visitor', search: c => c.name.toLowerCase().includes('kira') },
        { name: 'Odo', performer: 'René Auberjonois', search: c => c.name === 'Odo' },
        { name: 'Jadzia Dax', performer: 'Terry Farrell', search: c => c.name.toLowerCase().includes('jadzia') },
        { name: 'Julian Bashir', performer: 'Alexander Siddig', search: c => c.name.toLowerCase().includes('bashir') },
        { name: 'Miles O\'Brien', performer: 'Colm Meaney', search: c => c.name.toLowerCase().includes('o\'brien') },
        { name: 'Quark', performer: 'Armin Shimerman', search: c => c.name === 'Quark' },
        { name: 'Worf', performer: 'Michael Dorn', search: c => c.name === 'Worf' },
        { name: 'Ezri Dax', performer: 'Nicole de Boer', search: c => c.name.toLowerCase().includes('ezri') },
        { name: 'Jake Sisko', performer: 'Cirroc Lofton', search: c => c.name.toLowerCase().includes('jake') },
        { name: 'Rom', performer: 'Max Grodénchik', search: c => c.name === 'Rom' },
        { name: 'Nog', performer: 'Aron Eisenberg', search: c => c.name === 'Nog' },
        { name: 'Garak', performer: 'Andrew Robinson', search: c => c.name === 'Garak' || c.name === 'Elim Garak' },
        { name: 'Dukat', performer: 'Marc Alaimo', search: c => c.name === 'Dukat' || c.name === 'Gul Dukat' }
      ],
      'star-trek-voyager': [
        { name: 'Kathryn Janeway', performer: 'Kate Mulgrew', search: c => c.name.toLowerCase().includes('janeway') },
        { name: 'Chakotay', performer: 'Robert Beltran', search: c => c.name === 'Chakotay' },
        { name: 'Tuvok', performer: 'Tim Russ', search: c => c.name === 'Tuvok' },
        { name: 'B\'Elanna Torres', performer: 'Roxann Dawson', search: c => c.name.toLowerCase().includes('torres') },
        { name: 'Tom Paris', performer: 'Robert Duncan McNeill', search: c => c.name.toLowerCase().includes('paris') },
        { name: 'Harry Kim', performer: 'Garrett Wang', search: c => c.name.toLowerCase().includes('kim') },
        { name: 'The Doctor', performer: 'Robert Picardo', search: c => c.name === 'The Doctor' || c.name === 'Emergency Medical Hologram' },
        { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => c.name.toLowerCase().includes('seven') },
        { name: 'Neelix', performer: 'Ethan Phillips', search: c => c.name === 'Neelix' },
        { name: 'Kes', performer: 'Jennifer Lien', search: c => c.name === 'Kes' }
      ],
      'star-trek-enterprise': [
        { name: 'Jonathan Archer', performer: 'Scott Bakula', search: c => c.name.toLowerCase().includes('archer') },
        { name: 'T\'Pol', performer: 'Jolene Blalock', search: c => c.name.toLowerCase().includes('t\'pol') },
        { name: 'Charles Tucker III', performer: 'Connor Trinneer', search: c => c.name.toLowerCase().includes('tucker') },
        { name: 'Malcolm Reed', performer: 'Dominic Keating', search: c => c.name.toLowerCase().includes('reed') },
        { name: 'Hoshi Sato', performer: 'Linda Park', search: c => c.name.toLowerCase().includes('sato') },
        { name: 'Travis Mayweather', performer: 'Anthony Montgomery', search: c => c.name.toLowerCase().includes('mayweather') },
        { name: 'Phlox', performer: 'John Billingsley', search: c => c.name === 'Phlox' },
        { name: 'Shran', performer: 'Jeffrey Combs', search: c => c.name === 'Shran' },
        { name: 'Porthos', performer: 'Beagles', search: c => c.name === 'Porthos' }
      ],
      'star-trek-discovery': [
        { name: 'Michael Burnham', performer: 'Sonequa Martin-Green', search: c => c.name.toLowerCase().includes('burnham') },
        { name: 'Saru', performer: 'Doug Jones', search: c => c.name === 'Saru' },
        { name: 'Paul Stamets', performer: 'Anthony Rapp', search: c => c.name.toLowerCase().includes('stamets') },
        { name: 'Sylvia Tilly', performer: 'Mary Wiseman', search: c => c.name.toLowerCase().includes('tilly') },
        { name: 'Cleveland Booker', performer: 'David Ajala', search: c => c.name.toLowerCase().includes('book') },
        { name: 'Christopher Pike', performer: 'Anson Mount', search: c => c.name.toLowerCase().includes('pike') },
        { name: 'Spock', performer: 'Ethan Peck', search: c => c.name === 'Spock' },
        { name: 'Philippa Georgiou', performer: 'Michelle Yeoh', search: c => c.name.toLowerCase().includes('georgiou') },
        { name: 'Hugh Culber', performer: 'Wilson Cruz', search: c => c.name.toLowerCase().includes('culber') }
      ],
      'star-trek-picard': [
        { name: 'Jean-Luc Picard', performer: 'Patrick Stewart', search: c => c.name === 'Jean-Luc Picard' },
        { name: 'Raffi Musiker', performer: 'Michelle Hurd', search: c => c.name.toLowerCase().includes('raffi') },
        { name: 'Cristóbal Rios', performer: 'Santiago Cabrera', search: c => c.name.toLowerCase().includes('rios') },
        { name: 'Agnes Jurati', performer: 'Alison Pill', search: c => c.name.toLowerCase().includes('jurati') },
        { name: 'Elnor', performer: 'Evan Evagora', search: c => c.name === 'Elnor' },
        { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => c.name.toLowerCase().includes('seven') },
        { name: 'Laris', performer: 'Orla Brady', search: c => c.name === 'Laris' },
        { name: 'Soji Asha', performer: 'Isa Briones', search: c => c.name.toLowerCase().includes('soji') },
        { name: 'Q', performer: 'John de Lancie', search: c => c.name === 'Q' },
        { name: 'William Riker', performer: 'Jonathan Frakes', search: c => c.name.toLowerCase().includes('riker') },
        { name: 'Deanna Troi', performer: 'Marina Sirtis', search: c => c.name.toLowerCase().includes('troi') }
      ],
      'star-trek-lower-decks': [
        { name: 'Beckett Mariner', performer: 'Tawny Newsome', search: c => c.name.toLowerCase().includes('mariner') },
        { name: 'Brad Boimler', performer: 'Jack Quaid', search: c => c.name.toLowerCase().includes('boimler') },
        { name: 'D\'Vana Tendi', performer: 'Noël Wells', search: c => c.name.toLowerCase().includes('tendi') },
        { name: 'Sam Rutherford', performer: 'Eugene Cordero', search: c => c.name.toLowerCase().includes('rutherford') },
        { name: 'Carol Freeman', performer: 'Dawnn Lewis', search: c => c.name.toLowerCase().includes('freeman') },
        { name: 'Jack Ransom', performer: 'Jerry O\'Connell', search: c => c.name.toLowerCase().includes('ransom') },
        { name: 'T\'Ana', performer: 'Gillian Vigman', search: c => c.name.toLowerCase().includes('t\'ana') },
        { name: 'Shaxs', performer: 'Fred Tatasciore', search: c => c.name === 'Shaxs' }
      ],
      'star-trek-strange-new-worlds': [
        { name: 'Christopher Pike', performer: 'Anson Mount', search: c => c.name.toLowerCase().includes('pike') },
        { name: 'Spock', performer: 'Ethan Peck', search: c => c.name === 'Spock' },
        { name: 'Una Chin-Riley', performer: 'Rebecca Romijn', search: c => c.name.toLowerCase().includes('una') || c.name.toLowerCase().includes('number one') },
        { name: 'La\'an Noonien-Singh', performer: 'Christina Chong', search: c => c.name.toLowerCase().includes('la\'an') },
        { name: 'Nyota Uhura', performer: 'Celia Rose Gooding', search: c => c.name.toLowerCase().includes('uhura') },
        { name: 'Erica Ortegas', performer: 'Melissa Navia', search: c => c.name.toLowerCase().includes('ortegas') },
        { name: 'Joseph M\'Benga', performer: 'Babs Olusanmokun', search: c => c.name.toLowerCase().includes('m\'benga') },
        { name: 'Christine Chapel', performer: 'Jess Bush', search: c => c.name.toLowerCase().includes('chapel') },
        { name: 'Hemmer', performer: 'Bruce Horak', search: c => c.name === 'Hemmer' }
      ],
      'star-trek-prodigy': [
        { name: 'Dal R\'El', performer: 'Brett Gray', search: c => c.name.toLowerCase().includes('dal') },
        { name: 'Gwyndala', performer: 'Ella Purnell', search: c => c.name.toLowerCase().includes('gwyn') },
        { name: 'Rok-Tahk', performer: 'Rylee Alazraqui', search: c => c.name.toLowerCase().includes('rok') },
        { name: 'Zero', performer: 'Angus Imrie', search: c => c.name === 'Zero' },
        { name: 'Jankom Pog', performer: 'Jason Mantzoukas', search: c => c.name.toLowerCase().includes('jankom') },
        { name: 'Murf', performer: 'Dee Bradley Baker', search: c => c.name === 'Murf' },
        { name: 'Hologram Janeway', performer: 'Kate Mulgrew', search: c => c.name.toLowerCase().includes('janeway') }
      ],
      'star-trek-the-original-series': [
        { name: 'James T. Kirk', performer: 'William Shatner', search: c => c.name.toLowerCase().includes('kirk') },
        { name: 'Spock', performer: 'Leonard Nimoy', search: c => c.name === 'Spock' },
        { name: 'Leonard McCoy', performer: 'DeForest Kelley', search: c => c.name.toLowerCase().includes('mccoy') },
        { name: 'Montgomery Scott', performer: 'James Doohan', search: c => c.name.toLowerCase().includes('scott') },
        { name: 'Nyota Uhura', performer: 'Nichelle Nichols', search: c => c.name.toLowerCase().includes('uhura') },
        { name: 'Hikaru Sulu', performer: 'George Takei', search: c => c.name.toLowerCase().includes('sulu') },
        { name: 'Pavel Chekov', performer: 'Walter Koenig', search: c => c.name.toLowerCase().includes('chekov') },
        { name: 'Christine Chapel', performer: 'Majel Barrett', search: c => c.name.toLowerCase().includes('chapel') }
      ],
      'star-trek-the-animated-series': [
        { name: 'James T. Kirk', performer: 'William Shatner', search: c => c.name.toLowerCase().includes('kirk') },
        { name: 'Spock', performer: 'Leonard Nimoy', search: c => c.name === 'Spock' },
        { name: 'Leonard McCoy', performer: 'DeForest Kelley', search: c => c.name.toLowerCase().includes('mccoy') },
        { name: 'Montgomery Scott', performer: 'James Doohan', search: c => c.name.toLowerCase().includes('scott') },
        { name: 'Nyota Uhura', performer: 'Nichelle Nichols', search: c => c.name.toLowerCase().includes('uhura') },
        { name: 'Hikaru Sulu', performer: 'George Takei', search: c => c.name.toLowerCase().includes('sulu') },
        { name: 'Pavel Chekov', performer: 'Walter Koenig', search: c => c.name.toLowerCase().includes('chekov') },
        { name: 'Christine Chapel', performer: 'Majel Barrett', search: c => c.name.toLowerCase().includes('chapel') },
        { name: 'M\'Ress', performer: 'Majel Barrett', search: c => c.name === 'M\'Ress' },
        { name: 'Arex', performer: 'James Doohan', search: c => c.name === 'Arex' }
      ]
    };
    
    // Process each series
    for (const series of seriesData) {
      const seriesSlug = series.slug || slugify(series.title);
      console.log(`Processing series: ${series.title} (${seriesSlug})`);
      
      // Get characters for this series from STAPI
      const characters = await getCharactersForSeries(series.title);
      
      // Enhance characters with additional data
      const enhancedCharacters = [];
      
      // First try to use STAPI data
      if (characters.length > 0) {
        for (const character of characters) {
          // Check if we already have data for this character in local cache
          const localChar = localCharactersData.find(c => c.uid === character.uid);
          // If not in local cache, check the main characters data
          const existingChar = localChar || charactersData.find(c => c.uid === character.uid);
          
          let enhancedChar = {
            name: character.name,
            uid: character.uid,
            performer: character.performer?.name || 'Unknown',
            image: null,
            url: null,
            description: null
          };
          
          // If we have existing data, use it
          if (existingChar) {
            enhancedChar.image = existingChar.wikiImage || null;
            enhancedChar.url = existingChar.wikiUrl || null;
            enhancedChar.description = existingChar.description || null;
          }
          
          enhancedCharacters.push(enhancedChar);
        }
      }
      
      // If we didn't get enough characters from STAPI, use the fallback list
      if (enhancedCharacters.length < 5 && seriesCast[seriesSlug]) {
        console.log(`Using fallback character list for ${series.title}`);
        
        // Clear the list and use the fallback
        enhancedCharacters.length = 0;
        
        // Find character data for each cast member in the fallback list
        for (const castMember of seriesCast[seriesSlug]) {
          // First check local cache
          const localChar = localCharactersData.find(castMember.search);
          // If not in local cache, check the main characters data
          const char = localChar || charactersData.find(castMember.search);
          
          if (char) {
            enhancedCharacters.push({
              name: castMember.name,
              image: char.wikiImage,
              url: char.wikiUrl,
              performer: castMember.performer,
              description: char.description || null
            });
            console.log(`Added ${castMember.name} to cast list for ${series.title}`);
          }
        }
      }
      
      // Store the enhanced characters for this series
      seriesCharacters[seriesSlug] = enhancedCharacters;
      console.log(`Added ${enhancedCharacters.length} characters for ${series.title}`);
    }
    
    // Write the data to the file
    console.log(`Writing series characters data to ${seriesCharactersPath}...`);
    await fs.writeFile(seriesCharactersPath, JSON.stringify(seriesCharacters, null, 2));
    
    console.log('Series characters cache built successfully!');
  } catch (error) {
    console.error('Error building series characters cache:', error);
  }
}

// Run the script
buildSeriesCharactersCache();