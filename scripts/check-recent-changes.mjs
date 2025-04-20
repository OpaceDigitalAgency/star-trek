
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Check if git is available
try {
  // Try to get recent changes to the characters/index.astro file
  const output = execSync('git log -p -- src/pages/characters/index.astro | head -n 100', { encoding: 'utf8' });
  console.log('Recent changes to src/pages/characters/index.astro:');
  console.log(output);
} catch (error) {
  console.log('Could not get git history. Git may not be available or this is not a git repository.');
  
  // If git is not available, check the file modification time
  const filePath = path.resolve('src/pages/characters/index.astro');
  try {
    const stats = fs.statSync(filePath);
    console.log('File modification time:', stats.mtime);
  } catch (error) {
    console.log('Could not get file stats:', error.message);
  }
}
