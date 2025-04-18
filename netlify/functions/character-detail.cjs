const data = require('../../src/data/characters.json');
const { slugify } = require('../../src/utils/slugify.cjs');
// We'll use dynamic import for node-fetch since it's an ES module

exports.handler = async function(event, context) {
  const slug = event.path.replace(/^\/characters\/|\/$/g, '');
  let char = data.find(c => slugify(c.name) === slug);

  // Fallback: If not found locally, try enrichment function
  if (!char) {
    // Try to reconstruct the name from the slug (replace dashes with spaces)
    const likelyName = slug.replace(/-/g, ' ');
    try {
      // Dynamically import node-fetch (ES module)
      const { default: fetch } = await import('node-fetch');
      
      const enrichmentUrl = `${process.env.URL || 'http://localhost:8888'}/.netlify/functions/character-enrichment?name=${encodeURIComponent(likelyName)}`;
      const resp = await fetch(enrichmentUrl);
      if (resp.ok) {
        char = await resp.json();
      }
    } catch (e) {
      // Ignore fetch errors, will return 404 below if char is still not found
      console.error('Error fetching character enrichment:', e);
    }
  }

  if (!char) {
    return { statusCode: 404, body: 'Not found' };
  }

  // Ensure wikiImage is present if available (no-op if already present)
  if (!char.wikiImage && char.wikiImageUrl) {
    char.wikiImage = char.wikiImageUrl;
  }

  // Instead of trying to import the Astro page module, create a simple HTML template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${char.name} | Star Trek Character Profile</title>
  <meta name="description" content="Learn about ${char.name}, a character from Star Trek.">
  <link rel="stylesheet" href="/styles/global.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${char.name}",
    "description": "${char.name} is a character from Star Trek.",
    "url": "https://star-trek-timelines.netlify.app/characters/${slugify(char.name)}/",
    "jobTitle": "${char.title || "Officer"}",
    "image": "${char.wikiImage || char.image || "/images/generic-character.jpg"}"
  }
  </script>
</head>
<body class="bg-space-black text-white">
  <div class="container mx-auto px-4 py-12">
    <div class="lcars-header mb-8">
      <div class="lcars-header-content">
        <h1 class="text-3xl">${char.name}</h1>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="md:col-span-1">
        <div class="lcars-panel">
          <div class="lcars-top-bar flex">
            <div class="w-32 h-8 bg-starfleet-gold rounded-tl-lg"></div>
            <div class="flex-1 h-8 bg-starfleet-blue"></div>
          </div>
          
          <div class="panel-content p-6">
            <div class="character-image aspect-square overflow-hidden mb-4">
              <img
                src="${char.wikiImage || char.image || "/images/generic-character.jpg"}"
                alt="${char.name}"
                class="w-full h-full object-cover"
                onerror="this.onerror=null; this.src='/images/generic-character.jpg';"
              />
            </div>
            
            ${char.wikiUrl ? `
              <a href="${char.wikiUrl}" target="_blank" rel="noopener noreferrer" class="text-starfleet-gold hover:underline inline-flex items-center mt-4">
                View on Memory Alpha <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
      
      <div class="md:col-span-2">
        <div class="lcars-panel">
          <div class="lcars-top-bar flex">
            <div class="w-32 h-8 bg-starfleet-gold rounded-tl-lg"></div>
            <div class="flex-1 h-8 bg-starfleet-blue"></div>
            <div class="w-16 h-8 bg-starfleet-red"></div>
          </div>
          
          <div class="panel-content p-6">
            <h2 class="text-2xl text-starfleet-gold mb-4">Character Profile</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              ${char.gender ? `
                <div class="profile-item">
                  <h3 class="text-white text-lg">Gender</h3>
                  <p class="text-gray-300">${char.gender}</p>
                </div>
              ` : ''}
              
              ${char.yearOfBirth ? `
                <div class="profile-item">
                  <h3 class="text-white text-lg">Year of Birth</h3>
                  <p class="text-gray-300">${char.yearOfBirth}</p>
                </div>
              ` : ''}
              
              ${char.yearOfDeath ? `
                <div class="profile-item">
                  <h3 class="text-white text-lg">Year of Death</h3>
                  <p class="text-gray-300">${char.yearOfDeath}</p>
                </div>
              ` : ''}
              
              ${char.title ? `
                <div class="profile-item">
                  <h3 class="text-white text-lg">Rank/Title</h3>
                  <p class="text-gray-300">${char.title}</p>
                </div>
              ` : ''}
              
              ${char.characterSpecies && char.characterSpecies.length > 0 ? `
                <div class="profile-item">
                  <h3 class="text-white text-lg">Species</h3>
                  <p class="text-gray-300">
                    ${char.characterSpecies.map(s => s.name).join(', ')}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <div class="mt-8">
              <a href="/characters/" class="inline-flex items-center text-starfleet-gold hover:underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to Characters
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'cache-control': 'public, max-age=0, s-maxage=86400'
    },
    body: html
  };
};