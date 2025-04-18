// netlify/functions/stapi-series-proxy.js
// Import fetch using dynamic import to support both ESM and CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';
const SERIES_CACHE_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'series.json');

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
    
    // Always use local JSON for filtering to support all filter types
    {
        // Use local JSON for global search/filter
        let allSeries = [];
        try {
            // Check if the series.json file exists
            if (fs.existsSync(SERIES_CACHE_PATH)) {
                // If it exists, read from it
                allSeries = JSON.parse(fs.readFileSync(SERIES_CACHE_PATH, 'utf-8'));
                console.log(`Read ${allSeries.length} series from local cache`);
            } else {
                // If it doesn't exist, fetch from STAPI and create it
                console.log('Local series cache not found, fetching from STAPI');
                const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
                if (!response.ok) {
                    throw new Error(`STAPI API error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                allSeries = data.series || [];
                
                // Write to cache file
                fs.writeFileSync(SERIES_CACHE_PATH, JSON.stringify(allSeries, null, 2));
                console.log(`Created local cache with ${allSeries.length} series`);
            }
        } catch (err) {
            console.error('Failed to load or create series data:', err);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to load series data' }),
            };
        }
    
        // Apply filters
        let filtered = allSeries;
        
        // Filter by title
        if (filters.title) {
            const titleLower = filters.title.toLowerCase();
            filtered = filtered.filter(s => s.title && s.title.toLowerCase().includes(titleLower));
        }
        
        // Filter by production company
        if (filters.productionCompany) {
            const companyLower = filters.productionCompany.toLowerCase();
            filtered = filtered.filter(s => 
                s.productionCompany && s.productionCompany.toLowerCase().includes(companyLower)
            );
        }
        
        // Filter by original network
        if (filters.originalNetwork) {
            const networkLower = filters.originalNetwork.toLowerCase();
            filtered = filtered.filter(s => 
                s.originalNetwork && s.originalNetwork.toLowerCase().includes(networkLower)
            );
        }
        
        // Filter by decade/era
        if (filters.decade) {
            const decade = parseInt(filters.decade);
            filtered = filtered.filter(s => {
                const startYear = s.productionStartYear ? parseInt(s.productionStartYear) : 0;
                const decadeStart = Math.floor(startYear / 10) * 10;
                return decadeStart === decade;
            });
        }
    
        // Paginate
        const pageNum = parseInt(pageNumber, 10) || 0;
        const pageSz = parseInt(pageSize, 10) || 20;
        const start = pageNum * pageSz;
        const end = start + pageSz;
        const pageSeries = filtered.slice(start, end);
    
        // Format response to match STAPI API
        const data = {
            page: {
                pageNumber: pageNum,
                pageSize: pageSz,
                numberOfElements: pageSeries.length,
                totalElements: filtered.length,
                totalPages: Math.ceil(filtered.length / pageSz),
                firstPage: pageNum === 0,
                lastPage: end >= filtered.length
            },
            sort: { clauses: [] },
            series: pageSeries
        };
    
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        };
    }
};