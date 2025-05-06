import fs from 'fs';
import path from 'path';

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  const pageNumber = parseInt(url.searchParams.get('pageNumber') || '0', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  
  // Extract filters
  const filters = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key !== 'pageNumber' && key !== 'pageSize') {
      filters[key] = value;
    }
  }

  // Read characters from JSON file
  const charactersPath = path.join(process.cwd(), 'src', 'data', 'characters.json');
  let allChars = [];
  
  try {
    const charactersData = await fs.promises.readFile(charactersPath, 'utf-8');
    allChars = JSON.parse(charactersData);
  } catch (err) {
    console.error('Failed to load characters.json:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to load character data' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Apply filters
  let filtered = allChars;
  
  if (filters.name) {
    const nameLower = filters.name.toLowerCase();
    filtered = filtered.filter(c => c.name && c.name.toLowerCase().includes(nameLower));
  }
  
  if (filters.species) {
    const speciesLower = filters.species.toLowerCase();
    filtered = filtered.filter(c =>
      (Array.isArray(c.characterSpecies) && c.characterSpecies.some(s => s.name && s.name.toLowerCase().includes(speciesLower))) ||
      (Array.isArray(c.species) && c.species.some(s => s.name && s.name.toLowerCase().includes(speciesLower)))
    );
  }
  
  if (filters.title) {
    const titleLower = filters.title.toLowerCase();
    filtered = filtered.filter(c => c.title && c.title.toLowerCase().includes(titleLower));
  }
  
  if (filters.isImportant === 'true' || filters.important === 'true') {
    filtered = filtered.filter(c => c.important === true || c.isImportant === true);
  }
  
  if (filters.keep === 'true') {
    // Ensure we only show primary actor records
    filtered = filtered.filter(c => c.keep === true);
    
    // Log how many records have keep=true for debugging
    console.log(`Found ${filtered.length} characters with keep=true`);
  }

  // Paginate
  const start = pageNumber * pageSize;
  const end = start + pageSize;
  const pageChars = filtered.slice(start, end);

  // Format response to match STAPI API
  const data = {
    page: {
      pageNumber: pageNumber,
      pageSize: pageSize,
      numberOfElements: pageChars.length,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
      firstPage: pageNumber === 0,
      lastPage: end >= filtered.length
    },
    sort: { clauses: [] },
    characters: pageChars
  };

  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}