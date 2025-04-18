#!/usr/bin/env node

/**
 * This script runs the improved duplicate handling scripts to ensure all character duplicates
 * are properly handled, with special attention to Spock and Worf entries.
 */

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to execute a script and return a promise
function executeScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running ${path.basename(scriptPath)}...`);
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ${path.basename(scriptPath)}: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(stdout);
      resolve();
    });
  });
}

// Run all scripts in sequence
async function runAllScripts() {
  try {
    // First run the improved duplicate handling script
    await executeScript(path.join(__dirname, 'fix-all-duplicates-improved.mjs'));
    
    // Then run the specific fixes for important characters
    await executeScript(path.join(__dirname, 'fix-spock-entries.mjs'));
    await executeScript(path.join(__dirname, 'fix-worf-entries.mjs'));
    
    console.log('\nAll character duplicates have been fixed!');
  } catch (error) {
    console.error('Error running duplicate fix scripts:', error);
    process.exit(1);
  }
}

// Run the function
runAllScripts();