// netlify/functions/stapi-proxy.js
// Import fetch using dynamic import to support both ESM and CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

exports.handler = async (event) => {
    // Define headers for all responses
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust if needed)
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS request (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    const { pageNumber = 0, pageSize = 48, page, ...filters } = event.queryStringParameters || {};
    
    // Always use local JSON for filtering to support all filter types
    // This ensures species and isImportant filters work just like name search
    {
        // Load and parse the JSON file fresh each time to avoid module caching
        const fs = require('fs');
        const path = require('path');
        let allChars;
        try {
            const filePath = path.join(__dirname, 'characters.json');
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            allChars = JSON.parse(fileContent);
            
            if (!Array.isArray(allChars)) {
                throw new Error('Invalid data format');
            }
            
            console.log(`Loaded ${allChars.length} characters from file`);
        } catch (err) {
            console.error('Failed to load characters.json:', err);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to load character data' }),
            };
        }
    
        // Apply filters
        let filtered = allChars;
        if (filters.name) {
            const nameLower = filters.name.toLowerCase();
            filtered = filtered.filter(c => c.name && c.name.toLowerCase().includes(nameLower));
        }
        if (filters.species) {
            const speciesLower = filters.species.toLowerCase();
            filtered = filtered.filter(c => {
                // Check characterSpecies array first
                if (Array.isArray(c.characterSpecies) && c.characterSpecies.length > 0) {
                    return c.characterSpecies.some(s => s.name && s.name.toLowerCase() === speciesLower);
                }
                // Fall back to species array
                if (Array.isArray(c.species) && c.species.length > 0) {
                    return c.species.some(s => s.name && s.name.toLowerCase() === speciesLower);
                }
                // If no species info, mark as Unknown
                return speciesLower === 'unknown';
            });
            console.log(`Found ${filtered.length} characters of species: ${filters.species}`);
        }
        if (filters.title) {
            const titleLower = filters.title.toLowerCase();
            filtered = filtered.filter(c => c.title && c.title.toLowerCase().includes(titleLower));
        }
        // Handle important filter (both true and false values)
        if (filters.isImportant === 'true' || filters.isImportant === true ||
            filters.important === 'true' || filters.important === true) {
            console.log('Filtering for important characters');
            filtered = filtered.filter(c => {
                const isImportant = c.important === true || c.important === 'true' ||
                                  c.isImportant === true || c.isImportant === 'true';
                return isImportant;
            });
            console.log(`Found ${filtered.length} important characters`);
        } else if (filters.isImportant === 'false' || filters.isImportant === false ||
                   filters.important === 'false' || filters.important === false) {
            console.log('Filtering for non-important characters');
            filtered = filtered.filter(c => {
                const isImportant = c.important === true || c.important === 'true' ||
                                  c.isImportant === true || c.isImportant === 'true';
                return !isImportant;
            });
            console.log(`Found ${filtered.length} non-important characters`);
        }
        // Handle keep filter (both true and false values)
        if (filters.keep === 'true' || filters.keep === true) {
            console.log('Filtering for primary actor records (keep=true)');
            filtered = filtered.filter(c => {
                const isPrimary = c.keep === true || c.keep === 'true';
                return isPrimary;
            });
            console.log(`Found ${filtered.length} characters with keep=true`);
        } else if (filters.keep === 'false' || filters.keep === false) {
            console.log('Filtering for non-primary actor records (keep=false)');
            filtered = filtered.filter(c => {
                const isPrimary = c.keep === true || c.keep === 'true';
                return !isPrimary;
            });
            console.log(`Found ${filtered.length} characters with keep=false`);
        }
    
        // Sort filtered array alphabetically by name
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        // Paginate
        const pageNum = parseInt(pageNumber, 10);
        const pageSz = parseInt(pageSize, 10);
        const start = pageNum * pageSz;
        const end = start + pageSz;
        const pageChars = filtered.slice(start, end);

        console.log(`Paginating: page ${pageNum}, size ${pageSz}, showing ${start}-${end} of ${filtered.length} characters`);
    
        // Format response to match STAPI API
        const data = {
            page: {
                pageNumber: pageNum,
                pageSize: pageSz,
                numberOfElements: pageChars.length,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / pageSz),
                firstPage: pageNum === 0,
                lastPage: end >= filtered.length
            },
            sort: { clauses: [] },
            characters: pageChars
        };
    
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };
    }
    };