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
    
    let apiUrl = `${STAPI_BASE_URL}/character/search`;
    
    // Ensure pageNumber and pageSize are integers
    const pageNum = parseInt(pageNumber, 10) || 0;
    const pageSz = parseInt(pageSize, 10) || 20;
    
    // Build query string for GET request
    const params = new URLSearchParams();
    params.append('pageNumber', pageNum);
    params.append('pageSize', pageSz);
    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            params.append(key, value);
        }
    }
    apiUrl += `?${params.toString()}`;
    
    console.log(`Proxying STAPI request to: ${apiUrl}`);
    
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
    
        const data = await response.json();
    
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