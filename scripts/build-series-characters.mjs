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
          // More flexible search for Riker
          return (name.includes('william') && name.includes('riker')) ||
                 name === 'will riker' ||
                 name === 'commander riker' ||
                 (name.includes('riker') && !name.includes('thomas') && !name.includes('kyle'));
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
        { name: 'Benjamin Sisko', performer: 'Avery Brooks', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('sisko') || name.includes('benjamin') || name === 'captain sisko';
        }},
        { name: 'Kira Nerys', performer: 'Nana Visitor', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('kira') || name.includes('nerys') || name === 'major kira';
        }},
        { name: 'Odo', performer: 'René Auberjonois', search: c => {
          const name = c.name.toLowerCase();
          return name === 'odo' || name.includes('odo');
        }},
        { name: 'Jadzia Dax', performer: 'Terry Farrell', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('jadzia') || (name.includes('dax') && !name.includes('ezri'));
        }},
        { name: 'Julian Bashir', performer: 'Alexander Siddig', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('bashir') || name.includes('julian') || name === 'dr. bashir';
        }},
        { name: 'Miles O\'Brien', performer: 'Colm Meaney', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('o\'brien') || name.includes('obrien') ||
                 name.includes('miles') || name === 'chief o\'brien' ||
                 name === 'chief obrien' || name === 'chief miles o\'brien';
        }},
        { name: 'Quark', performer: 'Armin Shimerman', search: c => {
          const name = c.name.toLowerCase();
          return name === 'quark' || name.includes('quark');
        }},
        { name: 'Worf', performer: 'Michael Dorn', search: c => {
          const name = c.name.toLowerCase();
          return name === 'worf' || name.includes('worf') ||
                 name === 'lieutenant commander worf' || name === 'lieutenant worf';
        }},
        { name: 'Ezri Dax', performer: 'Nicole de Boer', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('ezri') || (name.includes('dax') && name.includes('ezri'));
        }},
        { name: 'Jake Sisko', performer: 'Cirroc Lofton', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('jake') || (name.includes('sisko') && name.includes('jake'));
        }},
        { name: 'Rom', performer: 'Max Grodénchik', search: c => {
          const name = c.name.toLowerCase();
          return name === 'rom' || name.includes('rom');
        }},
        { name: 'Nog', performer: 'Aron Eisenberg', search: c => {
          const name = c.name.toLowerCase();
          return name === 'nog' || name.includes('nog');
        }},
        { name: 'Garak', performer: 'Andrew Robinson', search: c => {
          const name = c.name.toLowerCase();
          return name === 'garak' || name.includes('garak') || name === 'elim garak';
        }},
        { name: 'Dukat', performer: 'Marc Alaimo', search: c => {
          const name = c.name.toLowerCase();
          return name === 'dukat' || name.includes('dukat') || name === 'gul dukat';
        }}
      ],
      'star-trek-voyager': [
        { name: 'Kathryn Janeway', performer: 'Kate Mulgrew', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('janeway') || name.includes('kathryn') ||
                 name === 'captain janeway' || name === 'admiral janeway';
        }},
        { name: 'Chakotay', performer: 'Robert Beltran', search: c => {
          const name = c.name.toLowerCase();
          return name === 'chakotay' || name.includes('chakotay') ||
                 name === 'commander chakotay';
        }},
        { name: 'Tuvok', performer: 'Tim Russ', search: c => {
          const name = c.name.toLowerCase();
          return name === 'tuvok' || name.includes('tuvok') ||
                 name === 'lieutenant tuvok' || name === 'lt. tuvok';
        }},
        { name: 'B\'Elanna Torres', performer: 'Roxann Dawson', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('torres') || name.includes('b\'elanna') ||
                 name.includes('belanna') || name === 'lt. torres';
        }},
        { name: 'Tom Paris', performer: 'Robert Duncan McNeill', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('paris') || name.includes('tom') ||
                 name === 'lieutenant paris' || name === 'lt. paris';
        }},
        { name: 'Harry Kim', performer: 'Garrett Wang', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('kim') || (name.includes('harry') && !name.includes('mudd')) ||
                 name === 'ensign kim';
        }},
        { name: 'The Doctor', performer: 'Robert Picardo', search: c => {
          const name = c.name.toLowerCase();
          return name === 'the doctor' || name === 'emergency medical hologram' ||
                 name.includes('emh') || name.includes('doctor') ||
                 name.includes('voyager') && name.includes('hologram');
        }},
        { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('seven') || name.includes('seven of nine') ||
                 name.includes('annika') || name.includes('hansen');
        }},
        { name: 'Neelix', performer: 'Ethan Phillips', search: c => {
          const name = c.name.toLowerCase();
          return name === 'neelix' || name.includes('neelix');
        }},
        { name: 'Kes', performer: 'Jennifer Lien', search: c => {
          const name = c.name.toLowerCase();
          return name === 'kes' || name.includes('kes');
        }}
      ],
      'star-trek-enterprise': [
        { name: 'Jonathan Archer', performer: 'Scott Bakula', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('archer') || name.includes('jonathan') ||
                 name === 'captain archer' || name === 'captain jonathan archer';
        }},
        { name: 'T\'Pol', performer: 'Jolene Blalock', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('t\'pol') || name.includes('tpol') ||
                 name === 'subcommander t\'pol' || name === 'commander t\'pol';
        }},
        { name: 'Charles Tucker III', performer: 'Connor Trinneer', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('tucker') || name.includes('charles') ||
                 name.includes('trip') || name === 'commander tucker';
        }},
        { name: 'Malcolm Reed', performer: 'Dominic Keating', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('reed') || name.includes('malcolm') ||
                 name === 'lieutenant reed' || name === 'lt. reed';
        }},
        { name: 'Hoshi Sato', performer: 'Linda Park', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('sato') || name.includes('hoshi') ||
                 name === 'ensign sato';
        }},
        { name: 'Travis Mayweather', performer: 'Anthony Montgomery', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('mayweather') || name.includes('travis') ||
                 name === 'ensign mayweather';
        }},
        { name: 'Phlox', performer: 'John Billingsley', search: c => {
          const name = c.name.toLowerCase();
          return name === 'phlox' || name.includes('phlox') ||
                 name === 'dr. phlox' || name === 'doctor phlox';
        }},
        { name: 'Shran', performer: 'Jeffrey Combs', search: c => {
          const name = c.name.toLowerCase();
          return name === 'shran' || name.includes('shran') ||
                 name.includes('thy\'lek') || name === 'commander shran';
        }},
        { name: 'Porthos', performer: 'Beagles', search: c => {
          const name = c.name.toLowerCase();
          return name === 'porthos' || name.includes('porthos') ||
                 (name.includes('archer') && name.includes('dog'));
        }}
      ],
      'star-trek-discovery': [
        { name: 'Michael Burnham', performer: 'Sonequa Martin-Green', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('burnham') || name.includes('michael') ||
                 name === 'commander burnham' || name === 'captain burnham';
        }},
        { name: 'Saru', performer: 'Doug Jones', search: c => {
          const name = c.name.toLowerCase();
          return name === 'saru' || name.includes('saru') ||
                 name === 'commander saru' || name === 'captain saru';
        }},
        { name: 'Paul Stamets', performer: 'Anthony Rapp', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('stamets') || name.includes('paul') ||
                 name === 'lt. stamets' || name === 'lieutenant stamets';
        }},
        { name: 'Sylvia Tilly', performer: 'Mary Wiseman', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('tilly') || name.includes('sylvia') ||
                 name === 'ensign tilly' || name === 'cadet tilly';
        }},
        { name: 'Cleveland Booker', performer: 'David Ajala', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('book') || name.includes('cleveland') ||
                 name.includes('booker') || name === 'cleveland booker';
        }},
        { name: 'Christopher Pike', performer: 'Anson Mount', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('pike') || name.includes('christopher') ||
                 name === 'captain pike' || name === 'captain christopher pike';
        }},
        { name: 'Spock', performer: 'Ethan Peck', search: c => {
          const name = c.name.toLowerCase();
          return name === 'spock' || name.includes('spock') ||
                 name === 'lieutenant spock' || name.includes('s\'chn t\'gai spock');
        }},
        { name: 'Philippa Georgiou', performer: 'Michelle Yeoh', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('georgiou') || name.includes('philippa') ||
                 name === 'emperor georgiou' || name === 'captain georgiou';
        }},
        { name: 'Hugh Culber', performer: 'Wilson Cruz', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('culber') || name.includes('hugh') ||
                 name === 'dr. culber' || name === 'doctor culber';
        }},
        { name: 'Jett Reno', performer: 'Tig Notaro', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('reno') || name.includes('jett') ||
                 name === 'commander reno';
        }},
        { name: 'Adira Tal', performer: 'Blu del Barrio', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('adira') || name.includes('tal') ||
                 name === 'adira tal';
        }},
        { name: 'Gray Tal', performer: 'Ian Alexander', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('gray') || (name.includes('tal') && !name.includes('adira'));
        }}
      ],
      'star-trek-picard': [
        { name: 'Jean-Luc Picard', performer: 'Patrick Stewart', search: c => {
          const name = c.name.toLowerCase();
          return name === 'jean-luc picard' || name.includes('picard') ||
                 name === 'admiral picard' || name === 'captain picard';
        }},
        { name: 'Raffi Musiker', performer: 'Michelle Hurd', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('raffi') || name.includes('musiker') ||
                 name === 'commander musiker';
        }},
        { name: 'Cristóbal Rios', performer: 'Santiago Cabrera', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('rios') || name.includes('cristóbal') ||
                 name.includes('cristobal') || name === 'captain rios';
        }},
        { name: 'Agnes Jurati', performer: 'Alison Pill', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('jurati') || name.includes('agnes') ||
                 name === 'dr. jurati' || name === 'doctor jurati';
        }},
        { name: 'Elnor', performer: 'Evan Evagora', search: c => {
          const name = c.name.toLowerCase();
          return name === 'elnor' || name.includes('elnor');
        }},
        { name: 'Seven of Nine', performer: 'Jeri Ryan', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('seven') || name.includes('seven of nine') ||
                 name.includes('annika') || name.includes('hansen');
        }},
        { name: 'Laris', performer: 'Orla Brady', search: c => {
          const name = c.name.toLowerCase();
          return name === 'laris' || name.includes('laris');
        }},
        { name: 'Soji Asha', performer: 'Isa Briones', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('soji') || name.includes('asha') ||
                 name === 'soji asha';
        }},
        { name: 'Q', performer: 'John de Lancie', search: c => {
          const name = c.name.toLowerCase();
          return name === 'q' || name.includes('q entity');
        }},
        { name: 'William Riker', performer: 'Jonathan Frakes', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('riker') || name.includes('william') ||
                 name === 'captain riker' || name === 'admiral riker';
        }},
        { name: 'Deanna Troi', performer: 'Marina Sirtis', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('troi') || name.includes('deanna') ||
                 name === 'counselor troi';
        }}
      ],
      'star-trek-lower-decks': [
        { name: 'Beckett Mariner', performer: 'Tawny Newsome', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('mariner') || name.includes('beckett') ||
                 name === 'ensign mariner';
        }},
        { name: 'Brad Boimler', performer: 'Jack Quaid', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('boimler') || name.includes('brad') ||
                 name === 'ensign boimler' || name === 'lieutenant boimler';
        }},
        { name: 'D\'Vana Tendi', performer: 'Noël Wells', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('tendi') || name.includes('d\'vana') ||
                 name === 'ensign tendi';
        }},
        { name: 'Sam Rutherford', performer: 'Eugene Cordero', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('rutherford') || name.includes('sam') ||
                 name === 'ensign rutherford';
        }},
        { name: 'Carol Freeman', performer: 'Dawnn Lewis', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('freeman') || name.includes('carol') ||
                 name === 'captain freeman';
        }},
        { name: 'Jack Ransom', performer: 'Jerry O\'Connell', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('ransom') || name.includes('jack') ||
                 name === 'commander ransom';
        }},
        { name: 'T\'Ana', performer: 'Gillian Vigman', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('t\'ana') || name.includes('tana') ||
                 name === 'dr. t\'ana' || name === 'doctor t\'ana';
        }},
        { name: 'Shaxs', performer: 'Fred Tatasciore', search: c => {
          const name = c.name.toLowerCase();
          return name === 'shaxs' || name.includes('shaxs') ||
                 name === 'lieutenant shaxs';
        }}
      ],
      'star-trek-strange-new-worlds': [
        { name: 'Christopher Pike', performer: 'Anson Mount', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('pike') || name.includes('christopher') || name === 'captain pike';
        }},
        { name: 'Spock', performer: 'Ethan Peck', search: c => {
          const name = c.name.toLowerCase();
          return name === 'spock' || name.includes('s\'chn t\'gai spock');
        }},
        { name: 'Una Chin-Riley', performer: 'Rebecca Romijn', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('una') || name.includes('number one') || name.includes('chin-riley');
        }},
        { name: 'La\'an Noonien-Singh', performer: 'Christina Chong', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('la\'an') || name.includes('noonien') || name.includes('singh');
        }},
        { name: 'Nyota Uhura', performer: 'Celia Rose Gooding', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('uhura') || name.includes('nyota');
        }},
        { name: 'Erica Ortegas', performer: 'Melissa Navia', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('ortegas') || name.includes('erica');
        }},
        { name: 'Joseph M\'Benga', performer: 'Babs Olusanmokun', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('m\'benga') || name.includes('joseph') || name === 'dr. m\'benga';
        }},
        { name: 'Christine Chapel', performer: 'Jess Bush', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('chapel') || name.includes('christine');
        }},
        { name: 'Hemmer', performer: 'Bruce Horak', search: c => {
          const name = c.name.toLowerCase();
          return name === 'hemmer' || name.includes('hemmer');
        }}
      ],
      'star-trek-prodigy': [
        { name: 'Dal R\'El', performer: 'Brett Gray', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('dal') || name.includes('r\'el') ||
                 name === 'dal r\'el';
        }},
        { name: 'Gwyndala', performer: 'Ella Purnell', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('gwyn') || name.includes('gwyndala') ||
                 name === 'gwyndala';
        }},
        { name: 'Rok-Tahk', performer: 'Rylee Alazraqui', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('rok') || name.includes('tahk') ||
                 name === 'rok-tahk';
        }},
        { name: 'Zero', performer: 'Angus Imrie', search: c => {
          const name = c.name.toLowerCase();
          return name === 'zero' || name.includes('zero') ||
                 name.includes('medusan');
        }},
        { name: 'Jankom Pog', performer: 'Jason Mantzoukas', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('jankom') || name.includes('pog') ||
                 name === 'jankom pog';
        }},
        { name: 'Murf', performer: 'Dee Bradley Baker', search: c => {
          const name = c.name.toLowerCase();
          return name === 'murf' || name.includes('murf');
        }},
        { name: 'Hologram Janeway', performer: 'Kate Mulgrew', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('janeway') || name.includes('hologram') ||
                 name === 'emergency training hologram' || name.includes('emergency command hologram');
        }}
      ],
      'star-trek-the-original-series': [
        { name: 'James T. Kirk', performer: 'William Shatner', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'james t. kirk' || name === 'james kirk' ||
                 name === 'captain kirk' || name === 'admiral kirk' ||
                 (name.includes('kirk') && name.includes('james')));
        }},
        { name: 'Spock', performer: 'Leonard Nimoy', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'spock' ||
                 (name.includes('spock') && !name.includes('benjamin')));
        }},
        { name: 'Leonard McCoy', performer: 'DeForest Kelley', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'leonard mccoy' || name === 'leonard h. mccoy' ||
                 name === 'dr. mccoy' || name === 'doctor mccoy' ||
                 (name === 'mccoy') || name.includes('bones') ||
                 (name.includes('leonard') && name.includes('mccoy')));
        }},
        { name: 'Montgomery Scott', performer: 'James Doohan', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'montgomery scott' || name === 'lt. commander scott' ||
                 name.includes('scotty') ||
                 (name.includes('scott') && name.includes('montgomery') && !name.includes('a. montgomery')));
        }},
        { name: 'Nyota Uhura', performer: 'Nichelle Nichols', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('uhura') || name.includes('nyota') ||
                 name === 'lieutenant uhura' || name === 'lt. uhura';
        }},
        { name: 'Hikaru Sulu', performer: 'George Takei', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'hikaru sulu' || name === 'lieutenant sulu' || name === 'lt. sulu' ||
                 (name.includes('sulu') && !name.includes('demora')));
        }},
        { name: 'Pavel Chekov', performer: 'Walter Koenig', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'pavel chekov' || name === 'ensign chekov' || name === 'lieutenant chekov' ||
                 (name.includes('chekov') && !name.includes('andrei') && !name.includes('anton')));
        }},
        { name: 'Christine Chapel', performer: 'Majel Barrett', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('chapel') || name.includes('christine') ||
                 name === 'nurse chapel';
        }}
      ],
      'star-trek-the-animated-series': [
        { name: 'James T. Kirk', performer: 'William Shatner', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'james t. kirk' || name === 'james kirk' ||
                 name === 'captain kirk' || name === 'admiral kirk' ||
                 (name.includes('kirk') && name.includes('james')));
        }},
        { name: 'Spock', performer: 'Leonard Nimoy', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'spock' ||
                 (name.includes('spock') && !name.includes('benjamin')));
        }},
        { name: 'Leonard McCoy', performer: 'DeForest Kelley', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'leonard mccoy' || name === 'leonard h. mccoy' ||
                 name === 'dr. mccoy' || name === 'doctor mccoy' ||
                 (name === 'mccoy') || name.includes('bones') ||
                 (name.includes('leonard') && name.includes('mccoy')) ||
                 (name.includes('mccoy') && !name.includes('daniel') && !name.includes('david') && !name.includes('joanna')));
        }},
        { name: 'Montgomery Scott', performer: 'James Doohan', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'montgomery scott' || name === 'lt. commander scott' ||
                 name.includes('scotty') ||
                 (name.includes('scott') && name.includes('montgomery') && !name.includes('a. montgomery')));
        }},
        { name: 'Nyota Uhura', performer: 'Nichelle Nichols', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('uhura') || name.includes('nyota') ||
                 name === 'lieutenant uhura' || name === 'lt. uhura';
        }},
        { name: 'Hikaru Sulu', performer: 'George Takei', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'hikaru sulu' || name === 'lieutenant sulu' || name === 'lt. sulu' ||
                 (name.includes('sulu') && !name.includes('demora')));
        }},
        { name: 'Pavel Chekov', performer: 'Walter Koenig', search: c => {
          const name = c.name.toLowerCase();
          // More specific search to avoid matching with wrong characters
          return (name === 'pavel chekov' || name === 'ensign chekov' || name === 'lieutenant chekov' ||
                 (name.includes('chekov') && !name.includes('andrei') && !name.includes('anton')));
        }},
        { name: 'Christine Chapel', performer: 'Majel Barrett', search: c => {
          const name = c.name.toLowerCase();
          return name.includes('chapel') || name.includes('christine') ||
                 name === 'nurse chapel';
        }},
        { name: 'M\'Ress', performer: 'Majel Barrett', search: c => {
          const name = c.name.toLowerCase();
          return name === 'm\'ress' || name.includes('m\'ress') || name.includes('mress');
        }},
        { name: 'Arex', performer: 'James Doohan', search: c => {
          const name = c.name.toLowerCase();
          return name === 'arex' || name.includes('arex') || name.includes('lieutenant arex');
        }}
      ],
      'star-trek-starfleet-academy': [
        { name: 'Cadet Tyson', performer: 'Tig Notaro', search: c => {
          // Use a more specific search to avoid matching with unrelated characters
          const name = c.name.toLowerCase();
          // Prioritize exact matches for "Cadet Tyson" or similar
          return name === 'cadet tyson' ||
                 (name.includes('cadet') && name.includes('tyson')) ||
                 (name.includes('starfleet') && name.includes('tyson'));
        }},
        { name: 'Cadet Lucia Nandy', performer: 'Kerrice Brooks', search: c => {
          // Use a more specific search to avoid matching with unrelated characters
          const name = c.name.toLowerCase();
          // Prioritize exact matches for "Lucia Nandy" or similar
          return name === 'lucia nandy' ||
                 name === 'cadet lucia nandy' ||
                 (name.includes('cadet') && name.includes('lucia')) ||
                 (name.includes('cadet') && name.includes('nandy'));
        }},
        { name: 'Cadet Tilly', performer: 'Mary Wiseman', search: c => {
          // Use a more specific search to avoid matching with unrelated characters
          const name = c.name.toLowerCase();
          // Prioritize exact matches for "Cadet Tilly" or similar
          return name === 'cadet tilly' ||
                 (name.includes('cadet') && name.includes('tilly')) ||
                 (name.includes('cadet') && name.includes('sylvia') && name.includes('tilly'));
        }},
        { name: 'Admiral Janeway', performer: 'Kate Mulgrew', search: c => {
          // Use a more specific search to avoid matching with unrelated characters
          const name = c.name.toLowerCase();
          // Prioritize exact matches for "Admiral Janeway" or similar
          return name === 'admiral janeway' ||
                 (name.includes('admiral') && name.includes('janeway')) ||
                 (name.includes('admiral') && name.includes('kathryn'));
        }},
        { name: 'Commander Tricia Miller', performer: 'Hana Hatae', search: c => {
          // Use a more specific search to avoid matching with unrelated characters
          const name = c.name.toLowerCase();
          // Prioritize exact matches for "Commander Tricia Miller" or similar
          return name === 'commander tricia miller' ||
                 (name.includes('commander') && name.includes('tricia')) ||
                 (name.includes('commander') && name.includes('miller'));
        }}
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
          // Try multiple search strategies
          let char = null;
          const characterName = castMember.name.toLowerCase();
          const performerName = castMember.performer.toLowerCase();
          
          // Check if this is an animated series
          const isAnimatedSeries = seriesSlug.includes('animated') ||
                                  seriesSlug.includes('tas') ||
                                  seriesSlug.includes('lower-decks') ||
                                  seriesSlug.includes('prodigy');
          
          // Strategy 1: Exact filename match
          // Look for image files that exactly match the character name
          const nameWithoutApostrophes = characterName.replace(/'/g, '');
          const simplifiedName = nameWithoutApostrophes.replace(/[^a-z0-9]/g, '-');
          const exactNamePattern = simplifiedName.toLowerCase();
          
          // Find image files that might match this character
          const imageFiles = await fs.readdir(path.join(process.cwd(), 'public', 'images', 'character-cache'));
          
          // First try exact name match in filename
          const exactMatches = imageFiles.filter(file => {
            const lowerFile = file.toLowerCase();
            return lowerFile.includes(exactNamePattern) && lowerFile.includes('chma');
          });
          
          // If we found exact matches, use those
          let matchingFiles = exactMatches;
          
          // If no exact matches, fall back to word matching
          if (matchingFiles.length === 0) {
            const nameWords = simplifiedName.split('-').filter(word => word.length > 2);
            matchingFiles = imageFiles.filter(file => {
              const lowerFile = file.toLowerCase();
              return nameWords.some(word => lowerFile.includes(word)) && lowerFile.includes('chma');
            });
          }
          
          // Extract potential UIDs from matching filenames
          const potentialUIDs = [];
          
          // Strategy 1: Try exact name match (highest priority)
          console.log(`  Trying exact name match for ${castMember.name}...`);
          char = localCharactersData.find(c => c.name.toLowerCase() === characterName) ||
                 charactersData.find(c => c.name.toLowerCase() === characterName);
          
          // Strategy 2: Use the original search function
          if (!char) {
            console.log(`  Using search function for ${castMember.name}...`);
            const localChar = localCharactersData.find(castMember.search);
            const mainChar = charactersData.find(castMember.search);
            char = localChar || mainChar;
          }
          
          // Strategy 3: Try exact match with character name as a substring
          if (!char) {
            console.log(`  Trying exact substring match for ${castMember.name}...`);
            char = localCharactersData.find(c => {
                    const cName = c.name.toLowerCase();
                    return cName === characterName ||
                           cName.endsWith(` ${characterName}`) ||
                           cName.startsWith(`${characterName} `);
                  }) ||
                  charactersData.find(c => {
                    const cName = c.name.toLowerCase();
                    return cName === characterName ||
                           cName.endsWith(` ${characterName}`) ||
                           cName.startsWith(`${characterName} `);
                  });
          }
          
          // Strategy 4: Try combined first/last name match (more strict)
          if (!char) {
            console.log(`  Trying combined name match for ${castMember.name}...`);
            const nameParts = characterName.split(/\s+/);
            if (nameParts.length > 1) {
              const firstName = nameParts[0];
              const lastName = nameParts[nameParts.length - 1];
              
              // More strict matching - must be exact match for first and last name
              // or the character name must be a substring of the database entry
              char = localCharactersData.find(c => {
                      const cName = c.name.toLowerCase();
                      const cNameParts = cName.split(/\s+/);
                      return (cNameParts.length > 1 &&
                              cNameParts[0] === firstName &&
                              cNameParts[cNameParts.length - 1] === lastName) ||
                             (cName.includes(firstName) &&
                              cName.includes(lastName) &&
                              cName.includes(`${firstName} ${lastName}`));
                    }) ||
                    charactersData.find(c => {
                      const cName = c.name.toLowerCase();
                      const cNameParts = cName.split(/\s+/);
                      return (cNameParts.length > 1 &&
                              cNameParts[0] === firstName &&
                              cNameParts[cNameParts.length - 1] === lastName) ||
                             (cName.includes(firstName) &&
                              cName.includes(lastName) &&
                              cName.includes(`${firstName} ${lastName}`));
                    });
            }
          }
          
          // Strategy 5: Try performer name match (more accurate)
          if (!char) {
            console.log(`  Trying performer match for ${castMember.performer}...`);
            // First try exact performer match
            const performerName = castMember.performer.toLowerCase();
            
            // Try exact performer match first
            char = localCharactersData.find(c => c.performer && c.performer.toLowerCase() === performerName) ||
                   charactersData.find(c => c.performer && c.performer.toLowerCase() === performerName);
            
            // If no exact match, try partial match but with character name validation
            if (!char) {
              const performerRegex = new RegExp(castMember.performer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              
              // Get all potential matches
              const potentialMatches = localCharactersData.filter(c => c.performer && performerRegex.test(c.performer)) ||
                                      charactersData.filter(c => c.performer && performerRegex.test(c.performer));
              
              // Sort by similarity to character name
              if (potentialMatches.length > 0) {
                potentialMatches.sort((a, b) => {
                  const aNameSimilarity = calculateNameSimilarity(a.name.toLowerCase(), characterName);
                  const bNameSimilarity = calculateNameSimilarity(b.name.toLowerCase(), characterName);
                  return bNameSimilarity - aNameSimilarity;
                });
                
                // Use the best match
                char = potentialMatches[0];
              }
            }
          }
          
          // Helper function to calculate name similarity
          function calculateNameSimilarity(name1, name2) {
            // Simple similarity score based on common words
            const words1 = name1.split(/\s+/);
            const words2 = name2.split(/\s+/);
            
            let commonWords = 0;
            for (const word1 of words1) {
              if (words2.includes(word1)) {
                commonWords++;
              }
            }
            
            // Also check if one name is a substring of the other
            const isSubstring = name1.includes(name2) || name2.includes(name1);
            
            return commonWords + (isSubstring ? 2 : 0);
          }
          
          // Strategy 6: Try fuzzy name matching (improved)
          if (!char) {
            console.log(`  Trying fuzzy name match for ${castMember.name}...`);
            // Split the name into parts and look for matches on any part
            const nameParts = characterName.split(/\s+|['-]/);
            
            // First try to match all significant parts (length > 2)
            const significantParts = nameParts.filter(part => part.length > 2);
            
            // Get all potential matches that contain all significant parts
            let potentialMatches = [];
            
            // Try local characters data first
            const localMatches = localCharactersData.filter(c => {
              const cName = c.name.toLowerCase();
              return significantParts.every(part => cName.includes(part));
            });
            
            if (localMatches.length > 0) {
              potentialMatches = localMatches;
            } else {
              // Try main characters data
              const mainMatches = charactersData.filter(c => {
                const cName = c.name.toLowerCase();
                return significantParts.every(part => cName.includes(part));
              });
              
              if (mainMatches.length > 0) {
                potentialMatches = mainMatches;
              }
            }
            
            // If no matches found, try matching any significant part
            if (potentialMatches.length === 0) {
              // Try local characters data first
              const localMatches = localCharactersData.filter(c => {
                const cName = c.name.toLowerCase();
                return significantParts.some(part => cName.includes(part));
              });
              
              if (localMatches.length > 0) {
                potentialMatches = localMatches;
              } else {
                // Try main characters data
                const mainMatches = charactersData.filter(c => {
                  const cName = c.name.toLowerCase();
                  return significantParts.some(part => cName.includes(part));
                });
                
                if (mainMatches.length > 0) {
                  potentialMatches = mainMatches;
                }
              }
            }
            
            // Sort potential matches by similarity score
            if (potentialMatches.length > 0) {
              potentialMatches.sort((a, b) => {
                const aNameSimilarity = calculateNameSimilarity(a.name.toLowerCase(), characterName);
                const bNameSimilarity = calculateNameSimilarity(b.name.toLowerCase(), characterName);
                return bNameSimilarity - aNameSimilarity;
              });
              
              // Use the best match
              char = potentialMatches[0];
              console.log(`  Found fuzzy match: ${char.name} (similarity: ${calculateNameSimilarity(char.name.toLowerCase(), characterName)})`);
            }
          }
          
          // Strategy 7: Try matching by role/title (improved)
          if (!char) {
            console.log(`  Trying role/title match for ${castMember.name}...`);
            const commonTitles = ['captain', 'commander', 'lieutenant', 'ensign', 'doctor', 'dr', 'admiral', 'chief', 'major'];
            const hasTitle = commonTitles.some(title => characterName.includes(title));
            
            if (hasTitle) {
              // Extract the name without the title
              let nameWithoutTitle = characterName;
              for (const title of commonTitles) {
                nameWithoutTitle = nameWithoutTitle.replace(title, '').trim();
              }
              
              // Get all potential matches
              let potentialMatches = [];
              
              // Try local characters data first
              const localMatches = localCharactersData.filter(c => {
                const cName = c.name.toLowerCase();
                return cName.includes(nameWithoutTitle);
              });
              
              if (localMatches.length > 0) {
                potentialMatches = localMatches;
              } else {
                // Try main characters data
                const mainMatches = charactersData.filter(c => {
                  const cName = c.name.toLowerCase();
                  return cName.includes(nameWithoutTitle);
                });
                
                if (mainMatches.length > 0) {
                  potentialMatches = mainMatches;
                }
              }
              
              // Sort potential matches by similarity score
              if (potentialMatches.length > 0) {
                potentialMatches.sort((a, b) => {
                  const aNameSimilarity = calculateNameSimilarity(a.name.toLowerCase(), nameWithoutTitle);
                  const bNameSimilarity = calculateNameSimilarity(b.name.toLowerCase(), nameWithoutTitle);
                  return bNameSimilarity - aNameSimilarity;
                });
                
                // Use the best match
                char = potentialMatches[0];
                console.log(`  Found title match: ${char.name} (similarity: ${calculateNameSimilarity(char.name.toLowerCase(), nameWithoutTitle)})`);
              }
            }
          }
          
          // Strategy 8: Try to find an image file directly in the character-cache directory
          if (!char && imageFiles.length > 0) {
            console.log(`  Trying direct image file match for ${castMember.name}...`);
            
            // Create simplified versions of the character name for matching
            const simpleName = characterName.replace(/[^a-z0-9]/g, '');
            const nameWords = characterName.split(/\s+/);
            
            // Look for image files that might match this character
            const potentialMatches = [];
            
            for (const file of imageFiles) {
              const lowerFile = file.toLowerCase();
              
              // Check if the file contains the character's name or parts of it
              const containsName = lowerFile.includes(simpleName) ||
                                  nameWords.some(word => word.length > 2 && lowerFile.includes(word));
              
              // Check if the file contains the performer's name
              const containsPerformer = lowerFile.includes(castMember.performer.toLowerCase().replace(/\s+/g, ''));
              
              // If the file contains either the character's name or the performer's name, add it to potential matches
              if (containsName || containsPerformer) {
                // Extract the UID from the filename
                const uidMatch = lowerFile.match(/chma\d+/);
                if (uidMatch) {
                  const uid = uidMatch[0].toUpperCase();
                  
                  // Look for a character with this UID
                  const matchedChar = localCharactersData.find(c => c.uid && c.uid.includes(uid)) ||
                                     charactersData.find(c => c.uid && c.uid.includes(uid));
                  
                  if (matchedChar) {
                    potentialMatches.push({
                      char: matchedChar,
                      file: file,
                      similarity: calculateNameSimilarity(matchedChar.name.toLowerCase(), characterName)
                    });
                  }
                }
              }
            }
            
            // Sort potential matches by similarity score
            if (potentialMatches.length > 0) {
              potentialMatches.sort((a, b) => b.similarity - a.similarity);
              
              // Use the best match
              char = potentialMatches[0].char;
              console.log(`  Found image file match: ${char.name} (file: ${potentialMatches[0].file})`);
            }
          }
          
          if (char) {
            // For animated series, use placeholder images instead of real actor images
            let imageToUse = char.wikiImage;
            
            // For animated series, we want to use the actual character images if available
            // Only use placeholders if no image is available
            if (isAnimatedSeries && !imageToUse) {
              console.log(`  No image found for animated character ${castMember.name}, using placeholder`);
              // Use a series-specific placeholder for animated series
              if (seriesSlug.includes('animated') || seriesSlug.includes('tas')) {
                imageToUse = '/images/placeholder-tas.jpg';
              } else if (seriesSlug.includes('lower-decks')) {
                imageToUse = '/images/placeholder-disco.jpg'; // Using disco as placeholder for lower decks
              } else if (seriesSlug.includes('prodigy')) {
                imageToUse = '/images/placeholder-disco.jpg'; // Using disco as placeholder for prodigy
              } else {
                imageToUse = '/images/generic-character.jpg';
              }
            }
            
            enhancedCharacters.push({
              name: castMember.name,
              image: imageToUse,
              url: char.wikiUrl,
              performer: castMember.performer,
              description: char.description || null,
              matchedWith: char.name, // Add this for debugging
              isAnimated: isAnimatedSeries // Add this to indicate if it's an animated series
            });
            console.log(`✅ Added ${castMember.name} to cast list for ${series.title} (matched with ${char.name})`);
          } else {
            console.log(`❌ Could not find match for ${castMember.name} (${castMember.performer}) in ${series.title}`);
            
            // Add the character anyway, but with a character-specific or series-specific placeholder
            let placeholderImage = null;
            
            // For animated series, ALWAYS use a placeholder image
            if (isAnimatedSeries) {
              // Use a series-specific placeholder for animated series
              if (seriesSlug.includes('animated') || seriesSlug.includes('tas')) {
                placeholderImage = '/images/placeholder-tas.jpg';
              } else if (seriesSlug.includes('lower-decks')) {
                placeholderImage = '/images/placeholder-disco.jpg'; // Using disco as placeholder for lower decks
              } else if (seriesSlug.includes('prodigy')) {
                placeholderImage = '/images/placeholder-disco.jpg'; // Using disco as placeholder for prodigy
              } else {
                placeholderImage = '/images/generic-character.jpg';
              }
            } else if (seriesSlug.includes('starfleet-academy')) {
              // For Starfleet Academy, use disco placeholder
              placeholderImage = '/images/placeholder-disco.jpg';
            } else {
              // For live-action series, try character-specific placeholders first
              const name = castMember.name.toLowerCase();
              if (name.includes('sisko')) {
                placeholderImage = '/images/sisko-placeholder.jpg';
              } else if (name.includes('picard')) {
                placeholderImage = '/images/picard-placeholder.jpg';
              } else if (name.includes('kirk')) {
                placeholderImage = '/images/kirk-placeholder.jpg';
              } else if (name.includes('janeway')) {
                placeholderImage = '/images/janeway-placeholder.jpg';
              }
              // Then try series-specific placeholders
              else if (seriesSlug.includes('deep-space-nine') || seriesSlug.includes('ds9')) {
                placeholderImage = '/images/placeholder-ds9.jpg';
              } else if (seriesSlug.includes('next-generation') || seriesSlug.includes('tng')) {
                placeholderImage = '/images/placeholder-tng.jpg';
              } else if (seriesSlug.includes('original') || seriesSlug.includes('tos')) {
                placeholderImage = '/images/placeholder-tos.jpg';
              } else if (seriesSlug.includes('voyager') || seriesSlug.includes('voy')) {
                placeholderImage = '/images/placeholder-voy.jpg';
              } else if (seriesSlug.includes('enterprise') || seriesSlug.includes('ent')) {
                placeholderImage = '/images/placeholder-ent.jpg';
              } else if (seriesSlug.includes('discovery') || seriesSlug.includes('disco')) {
                placeholderImage = '/images/placeholder-disco.jpg';
              } else if (seriesSlug.includes('picard')) {
                placeholderImage = '/images/placeholder-picard.jpg';
              }
            }
            
            enhancedCharacters.push({
              name: castMember.name,
              image: placeholderImage,
              url: null,
              performer: castMember.performer,
              description: null,
              isAnimated: isAnimatedSeries // Add this to indicate if it's an animated series
            });
            console.log(`⚠️ Added ${castMember.name} to cast list for ${series.title} with placeholder image: ${placeholderImage || 'none'}`);
          }
        }
      }
      
      // Store the enhanced characters for this series
      seriesCharacters[seriesSlug] = enhancedCharacters;
      console.log(`Added ${enhancedCharacters.length} characters for ${series.title}`);
    }
    
    // Write the data to both locations
    console.log(`Writing series characters data to ${seriesCharactersPath}...`);
    await fs.writeFile(seriesCharactersPath, JSON.stringify(seriesCharacters, null, 2));
    
    // Also write to src/data for the series detail page
    const srcDataPath = path.join(__dirname, '..', 'src', 'data', 'series-characters.json');
    console.log(`Writing series characters data to ${srcDataPath}...`);
    await fs.writeFile(srcDataPath, JSON.stringify(seriesCharacters, null, 2));
    
    console.log('Series characters cache built successfully!');
  } catch (error) {
    console.error('Error building series characters cache:', error);
  }
}

// Run the script
buildSeriesCharactersCache();