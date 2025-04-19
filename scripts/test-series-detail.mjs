#!/usr/bin/env node

/**
 * This script tests the series-detail.js Netlify function
 * to verify that it's using the pre-fetched character data correctly.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Create a require function
const require = createRequire(import.meta.url);

// Test the function with a specific series
async function testSeriesDetail() {
  try {
    console.log('Testing series-detail.js function...');
    
    // Import the series-detail.js function using CommonJS require
    const seriesDetailPath = path.join(__dirname, '..', 'netlify', 'functions', 'series-detail.js');
    const seriesDetail = require(seriesDetailPath);
    
    // Create a mock event object
    const event = {
      path: '/series/star-trek-the-next-generation',
      queryStringParameters: {
        slug: 'star-trek-the-next-generation'
      }
    };
    
    // Call the handler function
    const result = await seriesDetail.handler(event);
    
    // Check if the function returned a valid response
    if (result.statusCode === 200) {
      console.log('Function returned a valid response!');
      
      // Parse the response body
      const body = JSON.parse(result.body);
      
      // Check if the cast data is included
      if (body.cast && Array.isArray(body.cast)) {
        console.log(`Found ${body.cast.length} cast members in the response.`);
        
        // Print the first few cast members
        console.log('First few cast members:');
        body.cast.slice(0, 3).forEach(member => {
          console.log(`- ${member.name} (${member.performer})`);
          console.log(`  Image: ${member.image}`);
          console.log(`  URL: ${member.url}`);
        });
      } else {
        console.error('No cast data found in the response!');
      }
    } else {
      console.error(`Function returned an error: ${result.statusCode}`);
      console.error(result.body);
    }
  } catch (error) {
    console.error('Error testing series-detail.js function:', error);
  }
}

// Run the test
testSeriesDetail();