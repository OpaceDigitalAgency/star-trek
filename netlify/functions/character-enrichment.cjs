import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Use node-fetch for HTTP requests
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const charactersPath = path.join(__dirname, '../../src/data/characters.json');
let charactersCache = null;

const cacheFilePath = '/tmp/character-cache.json';
let enrichmentCache = null;

// --- Rate Limiting, Retry, and Queue Logic ---

// In-memory queue for Memory Alpha requests
const requestQueue = [];
let isProcessingQueue = false;
const RATE_LIMIT_MS = 1000; // 1 request per second
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

// Helper to process the queue
async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const { fn, resolve, reject } = requestQueue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    }
    // Wait for rate limit
    await new Promise(res => setTimeout(res, RATE_LIMIT_MS));
  }
  isProcessingQueue = false;
}

// Enqueue a Memory Alpha request
function enqueueMemoryAlphaRequest(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

// Retry logic with exponential backoff
async function withRetries(fn, maxRetries = MAX_RETRIES) {
  let attempt = 0;
  let lastError;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Only retry on transient errors (network, 5xx)
      if (err.name === 'FetchError' || (err.response && err.response.status >= 500)) {
        attempt++;
        const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, backoff));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// Fetch Memory Alpha image for a character name
async function fetchMemoryAlphaImage(characterName) {
  const url = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/memory-alpha-search?query=${encodeURIComponent(characterName)}`;
  const response = await fetch(url, { timeout: 8000 });
  if (!response.ok) {
    const err = new Error(`Memory Alpha search failed: ${response.statusText}`);
    err.response = response;
    throw err;
  }
  const results = await response.json();
  // Pick the first result with an image
  const firstWithImage = results.find(r => r.imageUrl);
  return firstWithImage ? firstWithImage.imageUrl : null;
}

function loadCharacters() {
  if (!charactersCache) {
    const raw = fs.readFileSync(charactersPath, 'utf8');
    charactersCache = JSON.parse(raw);
  }
  return charactersCache;
}

// Load the enrichment cache from /tmp, or initialize if not present
function loadEnrichmentCache() {
  if (enrichmentCache) return enrichmentCache;
  try {
    const raw = fs.readFileSync(cacheFilePath, 'utf8');
    enrichmentCache = JSON.parse(raw);
  } catch (e) {
    enrichmentCache = {};
  }
  return enrichmentCache;
}

// Save the enrichment cache to /tmp
function saveEnrichmentCache() {
  if (enrichmentCache) {
    fs.writeFileSync(cacheFilePath, JSON.stringify(enrichmentCache), 'utf8');
  }
}

const handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const { uid, name } = event.queryStringParameters || {};
  if (!uid && !name) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing uid or name query parameter' })
    };
  }

  // Load cache
  const cache = loadEnrichmentCache();
  let cacheKey = null;
  if (uid) {
    cacheKey = `uid:${uid}`;
  } else if (name) {
    cacheKey = `name:${name.toLowerCase()}`;
  }

  // Check cache
  if (cacheKey && cache[cacheKey]) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(cache[cacheKey])
    };
  }

  // Not in cache, perform enrichment (lookup)
  const characters = loadCharacters();
  let character = null;

  if (uid) {
    character = characters.find(c => c.uid === uid);
  } else if (name) {
    // Case-insensitive match
    character = characters.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  if (!character) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Character not found' })
    };
  }

  // --- Memory Alpha enrichment with rate limiting, retry, and queue ---
  try {
    // Only enrich if character doesn't already have an imageUrl
    if (!character.imageUrl && character.name) {
      const imageUrl = await enqueueMemoryAlphaRequest(() =>
        withRetries(() => fetchMemoryAlphaImage(character.name))
      );
      if (imageUrl) {
        character.imageUrl = imageUrl;
      }
    }
  } catch (err) {
    // Log but do not fail the request if enrichment fails
    console.error('Memory Alpha enrichment failed:', err);
  }

  // Store in cache
  if (cacheKey) {
    cache[cacheKey] = character;
    saveEnrichmentCache();
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(character)
  };
};

export default handler;