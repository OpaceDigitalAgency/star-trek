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
3. Update `character-detail.cjs` to:
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