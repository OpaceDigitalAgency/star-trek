import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function main() {
  try {
    console.log('Updating Netlify functions characters.json with characters-local.json data...');
    
    // Load characters-local.json
    const localCharactersPath = path.join(rootDir, 'src', 'data', 'characters-local.json');
    console.log(`Loading characters from ${localCharactersPath}`);
    const localCharactersData = await fs.readFile(localCharactersPath, 'utf8');
    const localCharacters = JSON.parse(localCharactersData);
    
    // Write to netlify/functions/characters.json
    const netlifyCharactersPath = path.join(rootDir, 'netlify', 'functions', 'characters.json');
    console.log(`Writing ${localCharacters.length} characters to ${netlifyCharactersPath}`);
    await fs.writeFile(netlifyCharactersPath, JSON.stringify(localCharacters, null, 2));
    
    console.log('Successfully updated Netlify functions characters.json');
  } catch (error) {
    console.error('Error updating Netlify functions characters.json:', error);
    process.exit(1);
  }
}

main();