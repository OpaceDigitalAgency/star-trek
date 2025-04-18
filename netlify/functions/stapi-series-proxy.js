// netlify/functions/stapi-series-proxy.js
// Import fetch using dynamic import to support both ESM and CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

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
    
    // Always use local JSON for filtering to support all filter types
    {
        // Use local JSON for global search/filter
        const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'series.json');
        let allSeries = [];
        try {
            // Check if the file exists
            if (fs.existsSync(filePath)) {
                allSeries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } else {
                // If local file doesn't exist, fetch from STAPI
                console.log('Local series.json not found, fetching from STAPI');
                const response = await fetch(`${STAPI_BASE_URL}/series/search?pageSize=100`);
                const data = await response.json();
                allSeries = data.series || [];
            }
        } catch (err) {
            console.error('Failed to load series data:', err);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Failed to load series data' }),
            };
        }
    
        // Apply filters
        let filtered = allSeries;
        
        // Filter by title (search)
        if (filters.title) {
            const titleLower = filters.title.toLowerCase();
            filtered = filtered.filter(s => s.title && s.title.toLowerCase().includes(titleLower));
        }
        
        // Filter by production company
        if (filters.productionCompany) {
            const companyLower = filters.productionCompany.toLowerCase();
            filtered = filtered.filter(s => {
                const companyName = typeof s.productionCompany === 'object' && s.productionCompany?.name
                    ? s.productionCompany.name
                    : s.productionCompany;
                
                return companyName && companyName.toLowerCase().includes(companyLower);
            });
        }
        
        // Filter by original network
        if (filters.originalNetwork) {
            const networkLower = filters.originalNetwork.toLowerCase();
            filtered = filtered.filter(s => {
                const networkName = typeof s.originalNetwork === 'object' && s.originalNetwork?.name
                    ? s.originalNetwork.name
                    : s.originalNetwork;
                
                return networkName && networkName.toLowerCase().includes(networkLower);
            });
        }
        
        // Filter by decade
        if (filters.decade) {
            const decade = parseInt(filters.decade, 10);
            filtered = filtered.filter(s => {
                const startYear = s.productionStartYear;
                return startYear && Math.floor(startYear / 10) * 10 === decade;
            });
        }
        
        // Filter by abbreviation
        if (filters.abbreviation) {
            const abbrevLower = filters.abbreviation.toLowerCase();
            filtered = filtered.filter(s => s.abbreviation && s.abbreviation.toLowerCase().includes(abbrevLower));
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