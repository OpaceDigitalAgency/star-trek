# Star Trek Timelines - A chronological guide to the Star Trek universe

A comprehensive web application that provides a chronological guide to the Star Trek universe, including characters, series, and timeline events.

## Project Memory

This project uses the following files to maintain context and track progress:

- [PLANNING.md](./PLANNING.md) - Project goals, architecture, tools, naming conventions, and constraints
- [TASK.md](./TASK.md) - Active tasks, backlog, and subtasks
- [PROGRESS.md](./PROGRESS.md) - Chronological log of completed subtasks and summaries

## Image Caching

This project includes a system for caching character images locally to improve performance and reduce dependency on external APIs:

1. Images are downloaded from Memory Alpha and stored in `/public/images/character-cache/`
2. Character data is updated with local image paths and stored in `characters-local.json`
3. The main `characters.json` file is updated to use these local paths

### Scripts

The following npm scripts are available for managing image caching:

- `npm run cache-images` - Downloads character images from Memory Alpha and caches them locally
- `npm run update-json` - Updates characters.json to use local image paths
- `npm run prepare-images` - Runs both scripts in sequence

Run these scripts after adding new characters or when images aren't displaying correctly.

### Deployment Notes

When deploying to Netlify, be aware that:

1. The cached character images (in `public/images/character-cache/`) will be included in the deployment. This is approximately 7600 images (2GB).
2. The first deployment will be large, but subsequent deployments will only include changed files.
3. If you need to update the cached images, run `npm run prepare-images` before deploying.

**Important:** Netlify has a deployment size limit of 15GB per site, so this approach is viable. However, if you're concerned about deployment size or time, consider using a separate image hosting service and modifying the application to use those URLs instead.

### Deployment Scripts

The following npm scripts are available for deployment:

- `npm run prepare-deploy` - Prepares the project for deployment by ensuring characters.json is using local image paths and provides information about the deployment size
- `npm run deploy` - Runs the prepare-deploy script and then deploys to Netlify

To deploy to Netlify:

1. Run `npm run prepare-images` if you need to update the cached images
2. Run `npm run deploy` to deploy to Netlify

This will ensure that the characters.json file is using the local image paths and that the images are included in the deployment.
