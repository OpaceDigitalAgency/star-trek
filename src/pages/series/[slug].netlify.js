// src/pages/series/[slug].netlify.js
// This file is used for server-side rendering of series detail pages

import { stapiService } from '../../services/stapiService';
import { slugify } from '../../utils/slugify';

export async function handler(event, context) {
  try {
    // Get the slug from the path
    const slug = event.path.split('/').pop();
    
    // Load all series data
    let allSeries = [];
    try {
      // Try to import the local series data
      const fs = require('fs');
      const path = require('path');
      const seriesJsonPath = path.join(process.cwd(), 'src', 'data', 'series.json');
      
      if (fs.existsSync(seriesJsonPath)) {
        allSeries = JSON.parse(fs.readFileSync(seriesJsonPath, 'utf8'));
      } else {
        // Fallback to STAPI API if local data is not available
        allSeries = await stapiService.getSeries();
      }
    } catch (error) {
      console.error('Failed to load series data:', error);
      allSeries = await stapiService.getSeries();
    }
    
    // Find the series by slug or UID
    let series = allSeries.find(s => 
      s.slug === slug || 
      s.uid === slug || 
      slugify(s.title) === slug
    );
    
    // If not found, return 404
    if (!series) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Series not found',
          message: `No series found with slug or UID: ${slug}`
        })
      };
    }
    
    // Get episodes for this series if needed
    if (!series.episodes) {
      try {
        const episodes = await stapiService.getEpisodesBySeries(series.title);
        series.episodes = episodes;
      } catch (error) {
        console.error(`Error fetching episodes for series ${series.title}:`, error);
        series.episodes = [];
      }
    }
    
    // Return the series data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(series)
    };
  } catch (error) {
    console.error('Error in series detail handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
}