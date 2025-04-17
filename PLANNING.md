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