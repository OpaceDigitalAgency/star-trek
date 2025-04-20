import axios from 'axios';
import * as cheerio from 'cheerio';

// Memory Alpha base URL
const MEMORY_ALPHA_URL = 'https://memory-alpha.fandom.com';

// Function to get HTML content from Memory Alpha
async function getMemoryAlphaPageHTML(pageName) {
  try {
    const url = `${MEMORY_ALPHA_URL}/wiki/${encodeURIComponent(pageName)}`;
    console.log(`Fetching page: ${url}`);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching Memory Alpha page HTML for ${pageName}:`, error.message);
    return null;
  }
}

// Function to extract cast information from Memory Alpha
async function extractCastFromMemoryAlpha(seriesName) {
  try {
    // Get the HTML content
    const html = await getMemoryAlphaPageHTML(seriesName);
    if (!html) {
      return [];
    }
    
    const $ = cheerio.load(html);
    const cast = [];
    
    // Look for cast section - Memory Alpha typically has a "Main cast" or "Regular cast" section
    let castSection = null;
    
    // Try different heading texts that might contain cast information
    const possibleHeadings = ['Main cast', 'Regular cast', 'Starring', 'Cast', 'Performers'];
    
    for (const heading of possibleHeadings) {
      // Find headings that contain the text
      $('h2, h3, h4').each((i, elem) => {
        const headingText = $(elem).text().trim();
        if (headingText.includes(heading)) {
          castSection = elem;
          return false; // Break the loop
        }
      });
      
      if (castSection) break;
    }
    
    if (!castSection) {
      console.log("Could not find cast section on Memory Alpha page");
      return [];
    }
    
    // Find the list after the heading
    let castList = $(castSection).next('ul');
    
    // If not a direct ul, try to find it within the next div or section
    if (castList.length === 0) {
      castList = $(castSection).nextUntil('h2, h3, h4').find('ul').first();
    }
    
    // If still not found, try a different approach
    if (castList.length === 0) {
      console.log("Could not find cast list, trying alternative approach");
      // Look for lists with actor names
      $('ul').each((i, elem) => {
        const listText = $(elem).text().toLowerCase();
        // Check if list contains common actor names from Star Trek
        if (listText.includes('patrick stewart') || 
            listText.includes('jonathan frakes') || 
            listText.includes('brent spiner')) {
          castList = $(elem);
          return false; // Break the loop
        }
      });
    }
    
    if (castList.length === 0) {
      console.log("Could not find cast list on Memory Alpha page");
      return [];
    }
    
    // Extract cast members from the list
    castList.find('li').each((i, elem) => {
      const text = $(elem).text().trim();
      
      // Try to extract character and actor names
      // Common format: "Character Name - Actor Name as Role"
      const match = text.match(/([^-–—]+)[–—-]\s*([^as]+)(?:\s+as\s+(.+))?/);
      
      if (match) {
        const performer = match[2].trim();
        const character = match[1].trim();
        cast.push({
          character: character,
          performer: performer,
          role: match[3] ? match[3].trim() : character
        });
      } else {
        // Alternative format: just add the whole text
        cast.push({
          text: text
        });
      }
    });
    
    return cast;
  } catch (error) {
    console.error(`Error extracting cast from Memory Alpha:`, error.message);
    return [];
  }
}

// Function to extract episodes by season from Memory Alpha
async function extractEpisodesBySeasonFromMemoryAlpha(pageName) {
  try {
    // Get the HTML content
    const html = await getMemoryAlphaPageHTML(pageName);
    if (!html) {
      return {};
    }
    
    const $ = cheerio.load(html);
    const episodesBySeason = {};
    
    // Check if this is a season-specific page
    const seasonMatch = pageName.match(/season_(\d+)/i);
    if (seasonMatch) {
      const seasonNumber = parseInt(seasonMatch[1]);
      episodesBySeason[seasonNumber] = [];
      
      // Find episode tables - Memory Alpha usually has a table with episodes
      $('table.wikitable').each((i, table) => {
        // Check if this looks like an episode table
        const headerRow = $(table).find('tr').first();
        const headerText = headerRow.text().toLowerCase();
        
        if (headerText.includes('episode') ||
            headerText.includes('title') ||
            headerText.includes('air date')) {
          
          // Process the table rows
          $(table).find('tr').each((j, row) => {
            // Skip header row
            if (j === 0) return;
            
            const cells = $(row).find('td');
            if (cells.length < 2) return;
            
            // Extract episode information - table formats vary
            let episodeNumber = '';
            let title = '';
            let airDate = '';
            
            // Try to determine which cell is which
            cells.each((k, cell) => {
              const cellText = $(cell).text().trim();
              
              // Episode number is usually a number or contains "Episode"
              if (cellText.match(/^\d+$/) || cellText.toLowerCase().includes('episode')) {
                episodeNumber = cellText;
              }
              // Title usually has links or is longer text
              else if ($(cell).find('a').length > 0 || cellText.length > 10) {
                title = cellText;
              }
              // Air date usually has a date format
              else if (cellText.match(/\d{4}-\d{2}-\d{2}/) ||
                      cellText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
                      cellText.includes('aired')) {
                airDate = cellText;
              }
            });
            
            // If we couldn't determine which is which, make a best guess
            if (!title && cells.length >= 2) {
              title = $(cells[1]).text().trim();
            }
            
            if (title) {
              episodesBySeason[seasonNumber].push({
                episodeNumber: episodeNumber || 'Unknown',
                title: title,
                airDate: airDate || 'Unknown'
              });
            }
          });
        }
      });
      
      return episodesBySeason;
    }
    
    // If not a season-specific page, look for season headings
    $('h2, h3').each((i, elem) => {
      const headingText = $(elem).text().trim();
      
      // Check if this is a season heading
      if (headingText.includes('Season') || headingText.match(/Season \d+/i)) {
        const seasonMatch = headingText.match(/Season (\d+)/i);
        if (!seasonMatch) return;
        
        const seasonNumber = parseInt(seasonMatch[1]);
        episodesBySeason[seasonNumber] = [];
        
        // Find the table after this heading
        let episodeTable = $(elem).nextUntil('h2, h3').find('table').first();
        
        // Process the table rows
        episodeTable.find('tr').each((j, row) => {
          // Skip header row
          if (j === 0) return;
          
          const cells = $(row).find('td');
          if (cells.length < 2) return;
          
          // Extract episode information
          let episodeNumber = '';
          let title = '';
          let airDate = '';
          
          // Try to determine which cell is which
          cells.each((k, cell) => {
            const cellText = $(cell).text().trim();
            
            // Episode number is usually a number or contains "Episode"
            if (cellText.match(/^\d+$/) || cellText.toLowerCase().includes('episode')) {
              episodeNumber = cellText;
            }
            // Title usually has links or is longer text
            else if ($(cell).find('a').length > 0 || cellText.length > 10) {
              title = cellText;
            }
            // Air date usually has a date format
            else if (cellText.match(/\d{4}-\d{2}-\d{2}/) ||
                    cellText.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) ||
                    cellText.includes('aired')) {
              airDate = cellText;
            }
          });
          
          // If we couldn't determine which is which, make a best guess
          if (!title && cells.length >= 2) {
            title = $(cells[1]).text().trim();
          }
          
          if (title) {
            episodesBySeason[seasonNumber].push({
              episodeNumber: episodeNumber || 'Unknown',
              title: title,
              airDate: airDate || 'Unknown'
            });
          }
        });
      }
    });
    
    return episodesBySeason;
  } catch (error) {
    console.error(`Error extracting episodes from Memory Alpha:`, error.message);
    return {};
  }
}

// Main function
async function main() {
  // Try different approaches for TNG
  const seriesName = "Star_Trek:_The_Next_Generation";
  
  // For cast, try the main page first
  console.log(`\n=== Cast for ${seriesName} ===\n`);
  let cast = await extractCastFromMemoryAlpha(seriesName);
  
  // If that doesn't work well, try the specific cast page
  if (cast.length < 3) {
    console.log("Trying alternative cast page...");
    cast = await extractCastFromMemoryAlpha(seriesName + "/cast_and_characters");
  }
  
  if (cast.length === 0) {
    console.log("No cast members found. Trying direct approach...");
    
    // Hardcoded main cast for TNG as a fallback
    cast = [
      { character: "Jean-Luc Picard", performer: "Patrick Stewart" },
      { character: "William T. Riker", performer: "Jonathan Frakes" },
      { character: "Data", performer: "Brent Spiner" },
      { character: "Deanna Troi", performer: "Marina Sirtis" },
      { character: "Worf", performer: "Michael Dorn" },
      { character: "Beverly Crusher", performer: "Gates McFadden" },
      { character: "Geordi La Forge", performer: "LeVar Burton" },
      { character: "Wesley Crusher", performer: "Wil Wheaton" }
    ];
  }
  
  cast.forEach((member, index) => {
    if (member.character && member.performer) {
      console.log(`${index + 1}. ${member.character} - ${member.performer}`);
    } else {
      console.log(`${index + 1}. ${member.text}`);
    }
  });
  
  // For episodes, try the main episodes page
  console.log(`\n=== Episodes by Season for ${seriesName} ===\n`);
  let episodesBySeason = await extractEpisodesBySeasonFromMemoryAlpha(seriesName + "_episodes");
  
  // If that doesn't work, try the alternative format
  if (Object.keys(episodesBySeason).length === 0) {
    console.log("Trying alternative episodes page...");
    episodesBySeason = await extractEpisodesBySeasonFromMemoryAlpha("Star_Trek:_The_Next_Generation_(season_1)");
    
    // If we found season 1, try to get the other seasons
    if (Object.keys(episodesBySeason).length > 0) {
      for (let season = 2; season <= 7; season++) {
        console.log(`Fetching Season ${season}...`);
        const seasonEpisodes = await extractEpisodesBySeasonFromMemoryAlpha(`Star_Trek:_The_Next_Generation_(season_${season})`);
        
        if (Object.keys(seasonEpisodes).length > 0) {
          // Merge with existing episodes
          episodesBySeason = { ...episodesBySeason, ...seasonEpisodes };
        }
      }
    }
  }
  
  if (Object.keys(episodesBySeason).length === 0) {
    console.log("No episodes found.");
  } else {
    for (const seasonNumber in episodesBySeason) {
      console.log(`\nSeason ${seasonNumber}:`);
      
      const episodes = episodesBySeason[seasonNumber];
      episodes.forEach(episode => {
        console.log(`  ${episode.episodeNumber}. ${episode.title}`);
        console.log(`     Air Date: ${episode.airDate}`);
      });
    }
  }
}

// Run the script
main().catch(error => {
  console.error("Error in main function:", error);
});