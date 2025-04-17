// netlify/functions/stapi-proxy.js
import fetch from 'node-fetch';

const STAPI_BASE_URL = 'https://stapi.co/api/v1/rest';

export const handler = async (event) => {
    const { pageNumber = 0, pageSize = 20, ...filters } = event.queryStringParameters;

    const apiUrl = `${STAPI_BASE_URL}/character/search`;
    const body = new URLSearchParams();

    // Append standard pagination parameters
    body.append('pageNumber', pageNumber);
    body.append('pageSize', pageSize);

    // Append filter parameters dynamically
    for (const [key, value] of Object.entries(filters)) {
        if (value) { // Only add filters that have a value
            body.append(key, value);
        }
    }

    console.log(`Proxying STAPI request to: ${apiUrl} with body: ${body.toString()}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`STAPI Error (${response.status}): ${errorText}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `STAPI request failed: ${response.statusText}`, details: errorText }),
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust if needed)
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error in proxy function', details: error.message }),
        };
    }
};