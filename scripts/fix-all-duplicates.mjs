#!/usr/bin/env node

/**
 * This script runs both the handle-duplicate-actors.mjs and fix-spock-entries.mjs scripts
 * to ensure all character duplicates are properly handled.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Running handle-duplicate-actors.mjs...');
exec(`node ${path.join(__dirname, 'handle-duplicate-actors.mjs')}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error running handle-duplicate-actors.mjs: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
  
  console.log('\nRunning fix-spock-entries.mjs...');
  exec(`node ${path.join(__dirname, 'fix-spock-entries.mjs')}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running fix-spock-entries.mjs: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(stdout);
    
    console.log('\nAll character duplicates have been fixed!');
  });
});