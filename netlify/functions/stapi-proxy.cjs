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

    const { pageNumber = 0, pageSize = 20, ...filters } = event.queryStringParameters || {};
    
    // If any filter/search is present, use local JSON for global search/filter
    const useLocal = filters.name || filters.species || filters.title || filters.isImportant;
    
    if (useLocal) {
        // Use local JSON for global search/filter
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../src/data/characters.json');
        let allChars = [];
        try {
            allChars = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (err) {
            console.error('Failed to load local characters.json:', err);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to load local character data' }),
            };
        }
    
        // Apply filters
        let filtered = allChars;
        if (filters.name) {
            const nameLower = filters.name.toLowerCase();
            filtered = filtered.filter(c => c.name && c.name.toLowerCase().includes(nameLower));
        }
        if (filters.species) {
            filtered = filtered.filter(c =>
                (c.characterSpecies && c.characterSpecies.some(s => s.name === filters.species)) ||
                (c.species && c.species.some(s => s.name === filters.species))
            );
        }
        if (filters.title) {
            filtered = filtered.filter(c => c.title && c.title === filters.title);
        }
        if (filters.isImportant === 'true') {
            filtered = filtered.filter(c => c.isImportant === true);
        }
    
        // Paginate
        const pageNum = parseInt(pageNumber, 10) || 0;
        const pageSz = parseInt(pageSize, 10) || 20;
        const start = pageNum * pageSz;
        const end = start + pageSz;
        const pageChars = filtered.slice(start, end);
    
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
    
    // Otherwise, use STAPI API for normal pagination
    let apiUrl = `${STAPI_BASE_URL}/character/search`;
    
    // Ensure pageNumber and pageSize are integers
    const pageNum = parseInt(pageNumber, 10) || 0;
    const pageSz = parseInt(pageSize, 10) || 20;
    
    // Only forward supported parameters to STAPI API
    const params = new URLSearchParams();
    params.append('pageNumber', pageNum);
    params.append('pageSize', pageSz);
    if (filters.name) params.append('name', filters.name);
    
    apiUrl += `?${params.toString()}`;
    
    console.log(`[ROO-DEBUG-GET] Proxying STAPI request to: ${apiUrl}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET'
        });
    
        const rawText = await response.clone().text();
        console.log('STAPI raw response:', rawText);
    
        if (!response.ok) {
            console.error(`STAPI Error (${response.status}): ${rawText}`);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `STAPI request failed: ${response.statusText}`, details: rawText }),
            };
        }
    
        let data = await response.json();
    
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal Server Error in proxy function', details: error.message }),
        };
    }
    };