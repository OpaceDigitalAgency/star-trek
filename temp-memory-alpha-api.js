import axios from 'axios';

// Memory Alpha API URL
const MEMORY_ALPHA_API = 'https://memory-alpha.fandom.com/api.php';

// Function to search for a page on Memory Alpha
async function searchMemoryAlpha(query) {
  try {
    console.log(`Searching Memory Alpha for: ${query}`);
    
    const response = await axios.get(MEMORY_ALPHA_API, {
      params: {
        action: 'opensearch',
        search: query,
        limit: 10,
        namespace: 0,
        format: 'json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error searching Memory Alpha:`, error.message);
    return null;
  }
}

// Function to get page content from Memory Alpha
async function getPageContent(title) {
  try {
    console.log(`Fetching content for: ${title}`);
    
    const response = await axios.get(MEMORY_ALPHA_API, {
      params: {
        action: 'parse',
        page: title,
        format: 'json',
        prop: 'text|categories'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching page content:`, error.message);
    return null;
  }
}

// Function to extract cast information from Memory Alpha page content
function extractCastFromContent(content) {
  try {
    if (!content || !content.parse || !content.parse.text || !content.parse.text['*']) {
      return [];
    }
    
    const html = content.parse.text['*'];
    
    // Use regex to find cast information
    // This is a simplified approach - Memory Alpha's HTML structure can be complex
    const castRegex = /<li>([^<]+)<\/li>/g;
    const castMatches = [...html.matchAll(castRegex)];
    
    const cast = [];
    
    for (const match of castMatches) {
      const text = match[1].trim();
      
      // Look for patterns like "Actor as Character"
      if (text.includes(' as ')) {
        const [performer, character] = text.split(' as ').map(s => s.trim());
        
        // Clean up the character name (remove any HTML or extra text)
        const cleanCharacter = character.replace(/<[^>]*>/g, '').split('(')[0].trim();
        
        cast.push({
          character: cleanCharacter,
          performer: performer.replace(/<[^>]*>/g, '')
        });
      }
    }
    
    return cast;
  } catch (error) {
    console.error(`Error extracting cast:`, error.message);
    return [];
  }
}

// Function to extract episodes from Memory Alpha page content
function extractEpisodesFromContent(content) {
  try {
    if (!content || !content.parse || !content.parse.text || !content.parse.text['*']) {
      return {};
    }
    
    const html = content.parse.text['*'];
    
    // Look for season headings and episode tables
    const seasonRegex = /<h2[^>]*><span[^>]*>Season (\d+)<\/span>/g;
    const seasonMatches = [...html.matchAll(seasonRegex)];
    
    const episodesBySeason = {};
    
    for (const match of seasonMatches) {
      const seasonNumber = parseInt(match[1]);
      const seasonStart = match.index;
      
      // Find the next season heading or the end of the document
      const nextSeasonMatch = seasonMatches.find(m => m.index > seasonStart);
      const seasonEnd = nextSeasonMatch ? nextSeasonMatch.index : html.length;
      
      // Extract the HTML for this season
      const seasonHtml = html.substring(seasonStart, seasonEnd);
      
      // Look for episode tables
      const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
      const tableMatches = [...seasonHtml.matchAll(tableRegex)];
      
      if (tableMatches.length > 0) {
        // Assume the first table contains episodes
        const tableHtml = tableMatches[0][0];
        
        // Extract rows from the table
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        const rowMatches = [...tableHtml.matchAll(rowRegex)];
        
        episodesBySeason[seasonNumber] = [];
        
        // Skip the header row
        for (let i = 1; i < rowMatches.length; i++) {
          const rowHtml = rowMatches[i][0];
          
          // Extract cells from the row
          const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
          const cellMatches = [...rowHtml.matchAll(cellRegex)];
          
          if (cellMatches.length >= 2) {
            // Assume first cell is episode number, second is title
            const episodeNumber = cellMatches[0][1].replace(/<[^>]*>/g, '').trim();
            const title = cellMatches[1][1].replace(/<[^>]*>/g, '').trim();
            
            // Try to find air date if available
            let airDate = '';
            if (cellMatches.length >= 3) {
              airDate = cellMatches[2][1].replace(/<[^>]*>/g, '').trim();
            }
            
            episodesBySeason[seasonNumber].push({
              episodeNumber,
              title,
              airDate
            });
          }
        }
      }
    }
    
    return episodesBySeason;
  } catch (error) {
    console.error(`Error extracting episodes:`, error.message);
    return {};
  }
}

// Main function
async function main() {
  // Search for TNG
  const searchResults = await searchMemoryAlpha('Star Trek: The Next Generation');
  
  if (!searchResults || !searchResults[1] || searchResults[1].length === 0) {
    console.log("No results found for TNG");
    return;
  }
  
  // Get the exact page title
  const pageTitle = searchResults[1][0];
  console.log(`Found page: ${pageTitle}`);
  
  // Get the page content
  const pageContent = await getPageContent(pageTitle);
  
  // Extract cast information
  console.log(`\n=== Cast for ${pageTitle} ===\n`);
  const cast = extractCastFromContent(pageContent);
  
  if (cast.length === 0) {
    console.log("No cast members found in the page content.");
    console.log("Using hardcoded cast list as fallback:");
    
    // Fallback cast list
    const fallbackCast = [
      { character: "Jean-Luc Picard", performer: "Patrick Stewart" },
      { character: "William T. Riker", performer: "Jonathan Frakes" },
      { character: "Data", performer: "Brent Spiner" },
      { character: "Deanna Troi", performer: "Marina Sirtis" },
      { character: "Worf", performer: "Michael Dorn" },
      { character: "Beverly Crusher", performer: "Gates McFadden" },
      { character: "Geordi La Forge", performer: "LeVar Burton" },
      { character: "Wesley Crusher", performer: "Wil Wheaton" }
    ];
    
    fallbackCast.forEach((member, index) => {
      console.log(`${index + 1}. ${member.character} - ${member.performer}`);
    });
  } else {
    cast.forEach((member, index) => {
      console.log(`${index + 1}. ${member.character} - ${member.performer}`);
    });
  }
  
  // Search for episodes page
  console.log(`\n=== Episodes for ${pageTitle} ===\n`);
  const episodesSearch = await searchMemoryAlpha(`${pageTitle} episodes`);
  
  if (!episodesSearch || !episodesSearch[1] || episodesSearch[1].length === 0) {
    console.log("No episode list found. Trying season pages...");
    
    // Try to get episodes by season
    const episodesBySeason = {};
    
    for (let season = 1; season <= 7; season++) {
      const seasonSearch = await searchMemoryAlpha(`${pageTitle} season ${season}`);
      
      if (seasonSearch && seasonSearch[1] && seasonSearch[1].length > 0) {
        const seasonTitle = seasonSearch[1][0];
        console.log(`Found season page: ${seasonTitle}`);
        
        const seasonContent = await getPageContent(seasonTitle);
        const seasonEpisodes = extractEpisodesFromContent(seasonContent);
        
        // Merge with existing episodes
        Object.assign(episodesBySeason, seasonEpisodes);
      }
    }
    
    if (Object.keys(episodesBySeason).length === 0) {
      console.log("Could not find episode information.");
    } else {
      // Display episodes by season
      for (const seasonNumber in episodesBySeason) {
        console.log(`\nSeason ${seasonNumber}:`);
        
        const episodes = episodesBySeason[seasonNumber];
        episodes.forEach(episode => {
          console.log(`  ${episode.episodeNumber}. ${episode.title}`);
          if (episode.airDate) {
            console.log(`     Air Date: ${episode.airDate}`);
          }
        });
      }
    }
  } else {
    const episodesTitle = episodesSearch[1][0];
    console.log(`Found episodes page: ${episodesTitle}`);
    
    const episodesContent = await getPageContent(episodesTitle);
    const episodesBySeason = extractEpisodesFromContent(episodesContent);
    
    if (Object.keys(episodesBySeason).length === 0) {
      console.log("Could not extract episodes from the page.");
    } else {
      // Display episodes by season
      for (const seasonNumber in episodesBySeason) {
        console.log(`\nSeason ${seasonNumber}:`);
        
        const episodes = episodesBySeason[seasonNumber];
        episodes.forEach(episode => {
          console.log(`  ${episode.episodeNumber}. ${episode.title}`);
          if (episode.airDate) {
            console.log(`     Air Date: ${episode.airDate}`);
          }
        });
      }
    }
  }
}

// Run the script
main().catch(error => {
  console.error("Error in main function:", error);
});