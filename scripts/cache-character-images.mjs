import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { slugify } from '../src/utils/slugify.js';

const CHARACTERS_JSON = path.resolve('src/data/characters.json');
const OUTPUT_JSON = path.resolve('src/data/characters-local.json');
const IMAGES_DIR = path.resolve('public/images/character-cache');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function downloadImage(url, dest) {
  try {
    console.log(`Downloading: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://memory-alpha.fandom.com/',
        'Origin': 'https://memory-alpha.fandom.com'
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(dest, buffer);
    console.log(`Successfully saved to: ${dest}`);
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}: ${err.message}`);
    return false;
  }
}

async function processCharacter(char) {
  const ext = '.jpg';
  const filename = `${slugify(char.name || char.uid)}-${char.uid}${ext}`;
  const localPath = `/images/character-cache/${filename}`;
  const dest = path.join(IMAGES_DIR, filename);

  // Check if the cached image exists
  let alreadyExists = false;
  try {
    await fs.access(dest);
    alreadyExists = true;
  } catch {}

  if (alreadyExists) {
    // If we have a cached image, use it
    return { ...char, wikiImage: localPath };
  }

  // Get image URL from either wikiImage or imageUrl
  let imageUrl = char.wikiImage || char.imageUrl;

  // Extract the actual URL from the proxy URL
  if (imageUrl && imageUrl.includes('proxy-image?url=')) {
    const urlParam = new URLSearchParams(imageUrl.split('?')[1]).get('url');
    if (urlParam) {
      imageUrl = decodeURIComponent(urlParam);
    }
  }

  // If no valid image URL, return character with null wikiImage
  if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('/.'))) {
    return { ...char, wikiImage: null };
  }

  // Try to download the image
  const ok = await downloadImage(imageUrl, dest);
  if (!ok) {
    return { ...char, wikiImage: null };
  }

  // Return character with local image path
  return { ...char, wikiImage: localPath };
}

async function main() {
  await ensureDir(IMAGES_DIR);
  const raw = await fs.readFile(CHARACTERS_JSON, 'utf8');
  const characters = JSON.parse(raw);
  let count = 0;

  const updated = [];
  for (const char of characters) {
    const processedChar = await processCharacter(char);
    if (processedChar.wikiImage) count++;
    updated.push(processedChar);
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(updated, null, 2));
  console.log(`Updated ${count} characters with image paths. Data written to ${OUTPUT_JSON}`);
}

main().catch(console.error);