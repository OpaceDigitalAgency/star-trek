# Task Management

## Active Tasks
1. Fix admin issues:
   - Species dropdown, duplicates & search
   - Images not loading
   - Rank dropdown safety
   - Visual polish

## Completed Tasks
1. Fix the characters page issues:
   - Implement getAllCharacters() function to fetch all characters at build time
   - Fix the Memory Alpha image loop to fetch images more efficiently
   - Repair the client-side filter script for character search
   - Fix the rank dropdown feature
   - Implement graceful image fallback

2. Apply additional code patches:
   - Species mapping & deduplication using Map and Set
   - Improved image enrichment loop with higher budget and smart name handling
   - Search selector fix verification
   - Tailwind-friendly select styling with custom SVG chevrons

## Backlog
- Implement Fuse.js for fuzzy, accent-insensitive search
- Use astro:assets to generate optimized WebP placeholders
- Create on-demand revalidate hook for characters using Netlify Edge Function
- Performance quick-wins:
  - Client-side pagination with React-Window (1h)
  - Move image look-ups to Netlify Background Function (30min)
  - Add data:image/svg+xml placeholder via astro:assets (15min)

## Subtasks
### Fix Admin Issues (IN PROGRESS)
1. ⏳ Fix species dropdown, duplicates & search:
   - Correct the import and the species field
   - Keep only one entry per display name
2. ⏳ Fix images not loading:
   - Work around STAPI 301 redirects
   - Skip empty Memory Alpha results quickly
3. ⏳ Fix rank dropdown safety
4. ⏳ Add visual polish with Tailwind utilities

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