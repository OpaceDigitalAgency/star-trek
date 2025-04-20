# Project Planning

## Project Overview
Star Trek Timelines - A chronological guide to the Star Trek universe

## Goals
- Provide a comprehensive chronological guide to the Star Trek universe
- Display information about characters, series, and timeline events
- Fetch and display data from STAPI (Star Trek API)
- Enhance character data with images from Memory Alpha

## Architecture
- Frontend: Astro.js with Tailwind CSS
- API Integration: STAPI for Star Trek data
- Image Sources: Memory Alpha wiki
- Deployment: Netlify

## Tools
- STAPI (Star Trek API) for data
- Memory Alpha wiki for images
- Netlify for hosting and serverless functions
- Astro.js as the frontend framework
- Tailwind CSS for styling

## Naming Conventions
- Component files: PascalCase.astro
- Service files: camelCase.js
- Function names: camelCase
- CSS classes: kebab-case or Tailwind utility classes

## Constraints
- Need to handle large datasets efficiently (6000+ characters)
- Must avoid overloading Memory Alpha with too many requests
- Build time performance considerations for Netlify deployment

---

## Character Data Delivery Architecture

### Rationale
- The production build cannot always access the enriched `characters.json` (with `wikiImage` fields), causing the frontend to fall back to generic images.
- The STAPI API does not provide Memory Alpha images, and build-time enrichment for all 7,600+ characters is not feasible on Netlify.

### Solution: Hybrid Approach
- **Pre-generated Cache:** Keep a local `characters.json` with enriched data for important characters.
- **Netlify Enrichment Function:** Create a new serverless function (`character-enrichment.js`) that:
  - Accepts a character UID or name.
  - Fetches character data from STAPI.
  - Enriches it with Memory Alpha image data.
  - Returns the complete character object.
  - Implements caching for performance.

### Implementation Plan
1. Create `character-enrichment.js` Netlify function for on-demand enrichment.
2. Use Netlify's caching/KV store to cache enriched character data.
3. Update `character-detail.js` to:
   - Check the local cache first.
   - Fallback to the enrichment function if not found.
4. Optimize Memory Alpha requests (rate limiting, retries, queueing).
5. Update frontend to handle loading/progressive image states and fallbacks.

This ensures all character pages have proper images in production, balancing performance and completeness within Netlify's constraints.

---

## Frontend Progressive Image Loading

A reusable `ProgressiveImage` web component is used for all character images on both the /characters/ list and character detail pages. This component:

- Shows a skeleton loader while the image is loading.
- Uses the `wikiImage` field as the primary image source.
- Falls back to `/images/generic-character.jpg` if the image fails to load.
- Preserves accessibility by passing through `alt` text.
- Is loaded as a native web component and used in place of `<img>` tags.

This approach ensures a smooth, accessible, and robust image experience for all users.

---

## Module Compatibility in Netlify Functions

### Rationale
- Netlify Functions can be written in either CommonJS or ES Modules format, but mixing the two can cause compatibility issues.
- Some dependencies (like node-fetch) are ES Modules, while others use CommonJS.
- The project uses a mix of module formats, which can lead to runtime errors in the deployed functions.

### Solution: Consistent Module Handling
- **CommonJS for Netlify Functions:** All Netlify function files use the `.cjs` extension to explicitly indicate CommonJS format.
- **Dynamic Imports for ES Module Dependencies:** When a Netlify function needs to use an ES Module dependency (like node-fetch), it uses dynamic imports:
  ```js
  const { default: fetch } = await import('node-fetch');
  ```
- **Duplicate Utility Files:** For utility functions needed by both frontend (ES Modules) and Netlify functions (CommonJS), we maintain two versions:
  - `slugify.js` - ES Module version for frontend use
  - `slugify.cjs` - CommonJS version for Netlify function use

This approach ensures compatibility across the entire application while allowing us to use modern dependencies regardless of their module format.

### Direct HTML Templates for Netlify Functions
For character detail pages, we use a direct HTML template approach in the Netlify function instead of trying to import and render the Astro component. This approach:

1. Avoids module compatibility issues between CommonJS (Netlify functions) and ES Modules (Astro components)
2. Reduces dependencies and complexity in the serverless function
3. Maintains the same visual design and functionality as the Astro component
4. Improves reliability by eliminating potential runtime errors from module imports

The HTML template is embedded directly in the function code and populated with character data before being sent to the client. This ensures character detail pages work reliably in the production environment.
---

## Series Detail Page Architecture

### Episode Data Management
- **Lazy Loading Strategy:** Episodes are loaded on-demand when a season section is expanded
- **Data Caching:** Episode data is cached client-side after initial load to prevent redundant API calls
- **Progressive Enhancement:** Basic series information loads first, followed by episode details

### Error Handling Architecture
- **Layered Approach:**
  1. API-level error catching with retry mechanisms
  2. Data transformation layer with null/undefined handling
  3. UI-level error boundaries for graceful degradation
- **Fallback System:**
  - Default values for missing metadata
  - Placeholder text for null fields
  - Generic error messages for user feedback

### Object Display Strategy
- **Nested Object Handling:**
  - Deep object traversal with type checking
  - Formatted display of complex data structures
  - Custom serialization for special object types
- **Null Value Management:**
  - Explicit null checks at data boundaries
  - Contextual fallback values
  - Clear visual indication of missing data

This architecture ensures robust handling of series data while maintaining a smooth user experience, even when dealing with incomplete or malformed data from the API.

---

## Series Data Processing Pipeline

### Rationale
- The STAPI API provides comprehensive Star Trek data, but has some limitations:
  - Missing or incomplete data for newer series and seasons
  - Inconsistent naming conventions for series (e.g., "Star Trek" vs "Star Trek: The Original Series")
  - Incomplete character data for series
- Memory Alpha wiki provides additional information, but requires careful handling to avoid overloading with requests
- We need a reliable process to fetch, process, and display all series data, even when external APIs are incomplete

### Solution: Comprehensive Data Processing Pipeline
- **Multi-Source Approach:** Combine data from STAPI, Memory Alpha, and fallback data
- **Robust Filtering:** Ensure all Star Trek series are included, regardless of naming conventions
- **Fallback System:** Provide complete data for newer series and seasons not yet in STAPI
- **Unified Command:** Single script to update all series data

### Implementation: Key Scripts

1. **build-series-cache.mjs**
   - Fetches series data from STAPI API
   - Filters to include only Star Trek series
   - Normalizes series titles
   - Checks for missing series and adds them from fallback data
   - Enhances series data with Memory Alpha content
   - Outputs to `src/data/series.json`

2. **build-series-episodes.mjs**
   - Fetches season data for each series
   - Fetches episode data for each season
   - Organizes episodes by season
   - Adds fallback episode data for newer seasons
   - Updates the series data in `src/data/series.json`

3. **build-series-characters.mjs**
   - Uses manually curated lists of main cast members
   - Matches characters with STAPI data
   - Enhances character data with images
   - Outputs to both `netlify/functions/series-characters.json` and `src/data/series-characters.json`

4. **update-all-series-data.mjs**
   - Orchestrates the entire series data processing pipeline
   - Runs all three scripts in sequence
   - Ensures data consistency and completeness
   - Handles errors and ensures successful completion

### Benefits
- **Complete Data:** All series, seasons, and episodes are properly represented
- **Resilience:** System works even when external APIs are incomplete or unavailable
- **Maintainability:** Single command to update all data
- **Performance:** Efficient processing that balances completeness with build time constraints

This pipeline ensures that the application always has complete and accurate series data, providing users with a comprehensive view of the Star Trek universe.