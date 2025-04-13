# Star Trek Timelines

A comprehensive web application built with Astro and Sanity.io that maps the chronological universe of Star Trek, showing how all shows and episodes are interconnected.

## Features

- **SEO-friendly**: Server-rendered HTML with proper meta tags for every page
- **Interactive Timeline**: Visual representation of the Star Trek universe
- **Series Explorer**: Browse and filter all Star Trek shows
- **Episode Interconnections**: Discover how episodes relate across series
- **Character Database**: Information on key Star Trek characters
- **Sci-Fi UI Design**: LCARS-inspired interface elements

## Tech Stack

- **Astro**: Fast, static site generation with partial hydration
- **Sanity.io**: Structured content management
- **TailwindCSS**: Utility-first styling
- **Netlify**: Deployment and hosting

## Setup Instructions

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up Sanity.io:
   - Create a Sanity project
   - Copy `.env.example` to `.env` and add your Sanity project ID
   - Import schema from `src/sanity/schema.js`
4. Run development server with `npm run dev`

## Deployment

The site is deployed to Netlify. Any changes pushed to the main branch will trigger a new build and deployment.

## Content Editing

All content is managed through Sanity.io. To edit content:

1. Log into your Sanity Studio
2. Navigate to the content type you want to edit
3. Make your changes and publish
4. The site will rebuild with your changes

## License

This is a fan project. Star Trek and all related marks, logos, and characters are solely owned by CBS Studios Inc.