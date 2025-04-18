# Star Trek Timelines: Series Data Pipeline Audit  
**Date:** 2025-04-18

---

## 1. Data Pipeline Overview

### Diagram

```mermaid
flowchart TD
    A[User/Frontend Request] -->|/api or SSR| B[Netlify Function: stapi-series-proxy.js]
    B -->|Reads| C[src/data/series.json]
    B -->|If missing, fetches| D[STAPI API]
    B -->|Returns| E[Filtered/Paginated Series Data]
    E --> F[Astro Page: index.astro]
    F -->|Renders| G[Series List UI]

    subgraph Detail Page
        H[User/Frontend Request] -->|/series/[slug]| I[Netlify Function: series-detail.js or [slug].netlify.js]
        I -->|Reads| C
        I -->|If missing, fetches| D
        I -->|Finds by slug/UID| J[Series Object]
        I -->|If needed, fetches| K[Episodes from STAPI]
        J -->|Returns| L[Astro Page: [slug].astro]
        L -->|Renders| M[Series Detail UI]
    end
```

---

## 2. Key Files and Their Roles

- **Data Cache:**  
  - `src/data/series.json` — Local cache of all series, enriched with images, slugs, and wiki summaries.
- **Netlify Functions:**  
  - `netlify/functions/stapi-series-proxy.js` — API proxy for series list, supports filtering/pagination, prefers local cache.
  - `netlify/functions/series-detail.js` — API for single series detail, finds by slug/UID, fetches episodes if needed.
- **Astro Pages:**  
  - `src/pages/series/index.astro` — Renders the series list, imports local cache, supports filters/search/pagination.
  - `src/pages/series/[slug].astro` — Renders a single series detail page, statically generated from cache or API.
  - `src/pages/series/[slug].netlify.js` — SSR/API endpoint for dynamic series detail, similar logic to `series-detail.js`.
- **Supporting Docs:**  
  - `README.md`, `TASK.md`, `PLANNING.md` — Confirm and document the above flow, rationale, and implementation details.

---

## 3. Summary of Findings

- The series data pipeline is robust, using a hybrid approach: local cache for performance and reliability, with Netlify functions as API proxies and fallbacks to STAPI.
- Data is enriched with Memory Alpha images and summaries at build time or on-demand.
- Astro pages consume this data for both static and dynamic rendering, supporting filters, search, and timeline views.
- The architecture is well-documented and modular, with clear separation between data fetching, transformation, and presentation.

---

## 4. PROGRESS.md Entry (for 2025-04-18)

```
## 2025-04-18

- Audit complete: Series data pipeline reviewed.
- Data flows from Netlify function (`stapi-series-proxy.js`) to local cache (`src/data/series.json`), with fallback to STAPI API.
- Series detail is served by `series-detail.js`/`[slug].netlify.js`, supporting slug/UID lookup and episode enrichment.
- Astro pages (`index.astro`, `[slug].astro`) render the list and detail views, importing or fetching data as needed.
- Memory Alpha integration provides images and summaries.
- Architecture is modular, performant, and well-documented.