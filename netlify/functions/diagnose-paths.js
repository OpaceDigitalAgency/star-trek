// netlify/functions/diagnose-paths.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  try {
    const functionDir = __dirname;
    const cwd = process.cwd();
    const srcDataDir = path.resolve(cwd, 'src', 'data');
    const netlifyFunctionsDir = path.resolve(cwd, 'netlify', 'functions');


    let fileList = {};

    try {
        fileList['functionDir'] = functionDir;
        fileList['cwd'] = cwd;
        fileList['srcDataDir'] = srcDataDir;
        fileList['netlifyFunctionsDir'] = netlifyFunctionsDir;

        // List files in function directory
        fileList['functionDirContents'] = await fs.readdir(functionDir);

        // List files in src/data
        try {
            fileList['srcDataDirContents'] = await fs.readdir(srcDataDir);
        } catch (e) {
            fileList['srcDataDirContentsError'] = `Error reading src/data: ${e.message}`;
        }

         // List files in netlify/functions
        try {
            fileList['netlifyFunctionsDirContents'] = await fs.readdir(netlifyFunctionsDir);
        } catch (e) {
            fileList['netlifyFunctionsDirContentsError'] = `Error reading netlify/functions: ${e.message}`;
        }


    } catch (error) {
        fileList['errorListingFiles'] = error.message;
    }


    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fileList, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message }),
    };
  }
};