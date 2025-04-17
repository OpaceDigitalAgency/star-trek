# Task Management

## Active Tasks
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