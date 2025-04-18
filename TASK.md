# Task Management

## Active Tasks

### Hybrid Character Data Delivery Implementation

1. Create `character-enrichment.js` Netlify function for on-demand enrichment.
2. Implement caching for enriched character data.
3. Update `character-detail.js` to use the enrichment function as fallback.
4. Optimize Memory Alpha requests (rate limiting, retries, queueing).
5. ✅ Update frontend for loading/progressive image states and fallbacks.

None currently active.

## Completed Tasks
1. Fix admin issues:
   - Species dropdown, duplicates & search
   - Images not loading
   - Rank dropdown safety
   - Visual polish
   - Pagination implementation
   - Proper deduplication
   - Enhanced character data fetching
   - Improved species extraction
   - Fixed pagination calculation
   - Enhanced search functionality
   - Fixed Netlify build error

2. Fix the characters page issues:
   - Implement getAllCharacters() function to fetch all characters at build time
   - Fix the Memory Alpha image loop to fetch images more efficiently
   - Repair the client-side filter script for character search
   - Fix the rank dropdown feature
   - Implement graceful image fallback

3. Apply additional code patches:
   - Species mapping & deduplication using Map and Set
   - Improved image enrichment loop with higher budget and smart name handling
   - Search selector fix verification
   - Tailwind-friendly select styling with custom SVG chevrons

4. Fix characters page issues (NEW):
   - Patched the data service to handle character species data correctly
   - Tightened the image logic with better fallbacks
   - Reduced page size from 100 to 48 characters
   - Exported full dataset to browser for client-side processing
   - Made pagination search-aware
   - Debounced user input with 250ms delay

## Backlog
- Implement Fuse.js for fuzzy, accent-insensitive search
- Use astro:assets to generate optimized WebP placeholders
- Create on-demand revalidate hook for characters using Netlify Edge Function
- Performance quick-wins:
  - Client-side pagination with React-Window (1h)
  - Move image look-ups to Netlify Background Function (30min)
  - Add data:image/svg+xml placeholder via astro:assets (15min)

## Subtasks
### Fix Admin Issues (COMPLETED)
1. ✅ Fix species dropdown, duplicates & search:
   - Correct the import and the species field
   - Keep only one entry per display name
2. ✅ Fix images not loading:
   - Work around STAPI 301 redirects
   - Skip empty Memory Alpha results quickly
3. ✅ Fix rank dropdown safety
4. ✅ Add visual polish with Tailwind utilities
5. ✅ Implement pagination for better performance
6. ✅ Ensure proper deduplication of character data
7. ✅ Debug and fix character data fetching
8. ✅ Improve species extraction from API data
9. ✅ Fix pagination calculation
10. ✅ Enhance search functionality
11. ✅ Fix Netlify build error (undefined variable reference)

### Fix Characters Page (COMPLETED)
1. ✅ Update stapiService.js to add getAllCharacters() function
2. ✅ Modify characters/index.astro to use getAllCharacters() instead of getCharacters(0, 100)
3. ✅ Fix the Memory Alpha image loop with MAX_IMAGES_GLOBAL limit
4. ✅ Fix the client-side filter script by updating the selector
5. ✅ Fix the rank dropdown feature
6. ✅ Implement graceful image fallback for character cards

### Apply Additional Code Patches (COMPLETED)
1. ✅ Update species mapping & deduplication using Map and Set
2. ✅ Improve image enrichment loop with higher budget and better name handling
3. ✅ Ensure search selector fix is properly implemented
4. ✅ Implement Tailwind-friendly select styling

### Fix Characters Page Issues (COMPLETED)
1. ✅ Patch the data service:
   - Removed includeCharacterSpecies flag (deprecated)
   - Added follow-up calls for characters with empty characterSpecies
   - Normalized and deduplicated species data
2. ✅ Tighten the image logic:
   - Added validation to skip SVG and placeholder images
   - Implemented fallback to stapiService.getImageUrl(name, 'character')
3. ✅ Slim the character grid:
   - Changed PAGE_SIZE from 100 to 48 in characters/index.astro
4. ✅ Export the full dataset to the browser:
   - Added script tag with JSON data in the head
   - Replaced DOM scraping with JSON parsing in the client script
5. ✅ Make pagination search-aware:
   - Recalculated totalPages after every filter/search
   - Updated currentPage if needed
6. ✅ Debounce user input:
   - Wrapped search and select listeners in a 250ms debounce

### Fix Character Image and Detail Page Issues (COMPLETED)
1. ✅ Fix build-time first page results showing generic images:
   - Modified characters index page to directly import and use local characters data
   - Ensured character images are displayed correctly on first page load
2. ✅ Fix "important" checkbox filter:
   - Updated stapi-proxy.cjs to check for both property names (important and isImportant)
   - Updated characters index page to use the correct property name
3. ✅ Fix character detail pages "Unexpected token 'export'" error:
   - Created CommonJS version of the slugify function (slugify.cjs)
   - Updated character-detail.cjs to use the CommonJS version
4. ✅ Fix character detail pages "require() of ES Module" error:
   - Updated character-detail.cjs to use dynamic import for node-fetch
   - Added better error handling for fetch operations
5. ✅ Fix character detail pages "Not found" error:
   - Replaced Astro module import with direct HTML template
   - Maintained same layout and functionality
6. ✅ Fix character detail pages with direct UID URLs:
   - Modified character-detail.cjs to first try finding characters by UID
   - Added fallback to slugified name if not found by UID
### Series Page Implementation (COMPLETED)
1. ✅ Create Netlify function for proxying STAPI series requests:
   - Created stapi-series-proxy.js to handle series data requests
   - Added local caching in src/data/series.json
2. ✅ Create series data fetching and caching logic:
   - Developed build-series-cache.mjs script to fetch and cache series data
   - Added Memory Alpha integration for images and descriptions
3. ✅ Implement series listing page with grid layout:
   - Created responsive grid layout for series cards
   - Added toggle between in-universe chronology and release order views
4. ✅ Add filtering and search functionality:
   - Added filter by production company
   - Added filter by original network
   - Added filter by decade/era
   - Implemented search with debouncing
5. ✅ Implement pagination:
   - Added pagination controls with proper navigation
   - Made pagination work with filtering
6. ✅ Add image handling and caching:
   - Implemented progressive image loading
   - Added fallbacks for missing images
7. ✅ Create series detail page template:
   - Added series metadata display
   - Included Memory Alpha integration
   - Created timeline placement information section