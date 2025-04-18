const data = require('../../src/data/characters.json');
const { slugify } = require('../../src/utils/slugify.cjs');
// We'll use dynamic import for node-fetch since it's an ES module

exports.handler = async function(event, context) {
  const slug = event.path.replace(/^\/characters\/|\/$/g, '');
  
  // Extract UID from the slug (assuming format: name-slug-UIDVALUE)
  const uidMatch = slug.match(/([A-Z0-9]+)$/);
  const uid = uidMatch ? uidMatch[1] : null;
  
  // First try to find by UID extracted from the slug
  let char = uid ? data.find(c => c.uid === uid) : null;
  
  // If not found by UID, try to find by full slug match
  if (!char) {
    char = data.find(c => `${slugify(c.name)}-${c.uid}` === slug);
  }
  
  // If still not found, try to find by just the UID (for backward compatibility)
  if (!char) {
    char = data.find(c => c.uid === slug);
  }
  
  // If still not found, try to find by slugified name
  if (!char) {
    char = data.find(c => slugify(c.name) === slug);
  }

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

  // Create a full HTML template that matches the site's layout and styling
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  
  <!-- Primary Meta Tags -->
  <title>${char.name} | Star Trek Character Profile</title>
  <meta name="title" content="${char.name} | Star Trek Character Profile">
  <meta name="description" content="Learn about ${char.name}, a character from Star Trek.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="profile">
  <meta property="og:url" content="https://star-trek-timelines.netlify.app/characters/${slugify(char.name)}-${char.uid}/">
  <meta property="og:title" content="${char.name} | Star Trek Character Profile">
  <meta property="og:description" content="Learn about ${char.name}, a character from Star Trek.">
  <meta property="og:image" content="${char.wikiImage || char.image || "/images/generic-character.jpg"}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://star-trek-timelines.netlify.app/characters/${slugify(char.name)}-${char.uid}/">
  <meta property="twitter:title" content="${char.name} | Star Trek Character Profile">
  <meta property="twitter:description" content="Learn about ${char.name}, a character from Star Trek.">
  <meta property="twitter:image" content="${char.wikiImage || char.image || "/images/generic-character.jpg"}">
  
  <!-- Schema.org / JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${char.name}",
    "description": "${char.name} is a character from Star Trek.",
    "url": "https://star-trek-timelines.netlify.app/characters/${slugify(char.name)}-${char.uid}/",
    "jobTitle": "${char.title || "Officer"}",
    "image": "${char.wikiImage || char.image || "/images/generic-character.jpg"}"
  }
  </script>
  
  <!-- Preload critical assets -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'starfleet-blue': '#0099ff',
            'starfleet-blue-dark': '#004C99',
            'starfleet-red': '#ff3d3d',
            'starfleet-gold': '#ffcc00',
            'klingon-red': '#9A1515',
            'space-black': '#030a17',
            'space-deep': '#010a1f',
            'console-green': '#39FF88',
            'console-blue': '#00B2FF',
            'neon-blue': '#00f6ff',
          }
        }
      }
    }
  </script>
  
  <style>
    /* Base styles */
    :root {
      --starfleet-blue: #0099ff;
      --starfleet-blue-dark: #004C99;
      --starfleet-red: #ff3d3d;
      --starfleet-gold: #ffcc00;
      --klingon-red: #9A1515;
      --space-black: #030a17;
      --space-deep: #010a1f;
      --console-green: #39FF88;
      --console-blue: #00B2FF;
      --neon-blue: #00f6ff;
      --holodeck-grid: rgba(0, 178, 255, 0.2);
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--starfleet-blue);
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: var(--console-blue);
    }
    
    html {
      background-color: var(--space-black);
      color: white;
    }
    
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      font-family: 'Space Grotesk', 'Helvetica Neue', sans-serif;
      background: radial-gradient(circle at 50% 50%, var(--space-black), var(--space-deep));
      overflow-x: hidden;
    }
    
    /* Global effects */
    .noise-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2;
      pointer-events: none;
      background-image: url('/images/noise.png');
      opacity: 0.03;
      mix-blend-mode: overlay;
    }
    
    /* Stars background */
    .starfield-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }
    
    /* LCARS-inspired UI elements */
    .lcars-header {
      display: flex;
      border-radius: 35px 0 0 0;
      overflow: hidden;
      margin-bottom: 1rem;
      background: var(--space-black);
      position: relative;
    }
    
    .lcars-header::before {
      content: '';
      width: 50px;
      background: var(--starfleet-gold);
      border-radius: 35px 0 0 35px;
    }
    
    .lcars-header-content {
      background: linear-gradient(90deg, var(--starfleet-gold), #F8E589);
      color: var(--space-black);
      padding: 0.7rem 2.5rem;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: bold;
      flex-grow: 1;
      position: relative;
      z-index: 1;
    }
    
    .lcars-panel {
      background-color: rgba(3, 10, 23, 0.7);
      border: 1px solid var(--console-blue);
      border-radius: 8px;
      box-shadow: 0 0 15px rgba(0, 178, 255, 0.3), inset 0 0 20px rgba(0, 178, 255, 0.05);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(5px);
      transition: all 0.4s cubic-bezier(0.17, 0.67, 0.3, 0.96);
    }
    
    .lcars-panel::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--console-blue), transparent);
    }
    
    .character-image {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      width: 100%;
      height: 300px;
      margin-bottom: 1rem;
    }
    
    .character-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center top;
    }
    
    .profile-item {
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-left: 3px solid var(--starfleet-blue);
      background: rgba(0, 153, 255, 0.1);
      border-radius: 0 4px 4px 0;
    }
    
    .profile-item h3 {
      margin-bottom: 0.25rem;
      color: var(--starfleet-gold);
      font-weight: 600;
    }
    
    /* Navigation styles */
    .main-header {
      background-color: rgba(3, 10, 23, 0.9);
      backdrop-filter: blur(10px);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
    
    .site-logo {
      position: relative;
      padding-bottom: 4px;
    }
    
    .nav-link {
      color: white;
      position: relative;
      padding: 4px 0;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }
    
    .nav-link:hover {
      color: var(--console-blue);
    }
    
    /* Footer styles */
    footer {
      background-color: var(--space-deep);
      border-top: 1px solid var(--starfleet-blue);
      padding: 2rem 0;
      margin-top: 3rem;
    }
    
    .footer-link {
      color: var(--console-blue);
      transition: all 0.3s ease;
      position: relative;
      padding-left: 16px;
      display: inline-block;
    }
    
    .footer-link:hover {
      color: var(--starfleet-gold);
    }
  </style>
</head>
<body>
  <!-- Stars Background -->
  <div class="starfield-container">
    <div class="stars-bg"></div>
  </div>
  <div class="noise-overlay"></div>
  
  <!-- Navigation -->
  <header class="main-header fixed top-0 left-0 right-0 z-50">
    <div class="container mx-auto px-4 py-4">
      <nav class="flex justify-between items-center">
        <a href="/" class="site-logo group flex items-baseline">
          <span class="text-2xl font-bold text-starfleet-gold mr-2">STAR TREK</span>
          <span class="text-xl text-white">TIMELINES</span>
        </a>
        
        <div class="nav-controls hidden md:flex items-center space-x-8">
          <a href="/series/" class="nav-link">Series</a>
          <a href="/timeline/" class="nav-link">Timeline</a>
          <a href="/characters/" class="nav-link">Characters</a>
          <a href="/about/" class="nav-link">About</a>
        </div>
      </nav>
    </div>
  </header>
  
  <!-- Main Content -->
  <main class="min-h-screen pb-20 pt-24">
    <div class="container mx-auto px-4">
      <div class="lcars-header mb-8">
        <div class="lcars-header-content">
          <h1 class="text-3xl">${char.name}</h1>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Character Image Column -->
        <div class="md:col-span-1">
          <div class="lcars-panel p-6">
            <div class="character-image">
              <img
                src="${char.wikiImage || char.image || "/images/generic-character.jpg"}"
                alt="${char.name}"
                onerror="this.onerror=null; this.src='/images/generic-character.jpg';"
              />
            </div>
            
            ${char.wikiUrl ? `
              <a href="${char.wikiUrl}" target="_blank" rel="noopener noreferrer" class="text-starfleet-gold hover:underline inline-flex items-center mt-4">
                View on Memory Alpha
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>
              </a>
            ` : ''}
          </div>
        </div>
        
        <!-- Character Details Column -->
        <div class="md:col-span-2">
          <div class="lcars-panel p-6">
            <h2 class="text-2xl text-starfleet-gold mb-6 border-b border-starfleet-blue pb-2">Character Profile</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              ${char.gender ? `
                <div class="profile-item">
                  <h3 class="text-lg">Gender</h3>
                  <p class="text-gray-300">${char.gender}</p>
                </div>
              ` : ''}
              
              ${char.yearOfBirth ? `
                <div class="profile-item">
                  <h3 class="text-lg">Year of Birth</h3>
                  <p class="text-gray-300">${char.yearOfBirth}</p>
                </div>
              ` : ''}
              
              ${char.yearOfDeath ? `
                <div class="profile-item">
                  <h3 class="text-lg">Year of Death</h3>
                  <p class="text-gray-300">${char.yearOfDeath}</p>
                </div>
              ` : ''}
              
              ${char.title ? `
                <div class="profile-item">
                  <h3 class="text-lg">Rank/Title</h3>
                  <p class="text-gray-300">${char.title}</p>
                </div>
              ` : ''}
              
              ${char.characterSpecies && char.characterSpecies.length > 0 ? `
                <div class="profile-item">
                  <h3 class="text-lg">Species</h3>
                  <p class="text-gray-300">
                    ${char.characterSpecies.map(s => s.name).join(', ')}
                  </p>
                </div>
              ` : ''}
              
              ${char.height ? `
                <div class="profile-item">
                  <h3 class="text-lg">Height</h3>
                  <p class="text-gray-300">${char.height} cm</p>
                </div>
              ` : ''}
              
              ${char.weight ? `
                <div class="profile-item">
                  <h3 class="text-lg">Weight</h3>
                  <p class="text-gray-300">${char.weight} kg</p>
                </div>
              ` : ''}
              
              ${char.deceased === true || char.deceased === false ? `
                <div class="profile-item">
                  <h3 class="text-lg">Status</h3>
                  <p class="text-gray-300">${char.deceased ? 'Deceased' : 'Alive'}</p>
                </div>
              ` : ''}
            </div>
            
            <div class="mt-8">
              <a href="/characters/" class="inline-flex items-center bg-starfleet-blue text-white px-4 py-2 rounded hover:bg-starfleet-blue-dark transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to Characters
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  
  <!-- Footer -->
  <footer>
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="mb-4">
            <span class="text-2xl font-bold text-starfleet-gold">STAR TREK</span>
            <span class="text-xl text-white ml-2">TIMELINES</span>
          </div>
          <p class="text-gray-400 mb-6">Exploring the Final Frontier, chronologically.</p>
        </div>
        
        <div>
          <h4 class="text-white text-lg mb-4 font-semibold">Explore</h4>
          <ul class="space-y-3">
            <li><a href="/series/" class="footer-link">All Series</a></li>
            <li><a href="/timeline/" class="footer-link">Timeline</a></li>
            <li><a href="/characters/" class="footer-link">Characters</a></li>
            <li><a href="/about/" class="footer-link">About Project</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="text-white text-lg mb-4 font-semibold">Legal</h4>
          <p class="text-gray-400 mb-2">Star Trek is a registered trademark of CBS Studios Inc.</p>
          <p class="text-gray-400">This fan site is not affiliated with CBS Studios Inc.</p>
        </div>
      </div>
      
      <div class="flex justify-between items-center mt-12 pt-6 border-t border-gray-800">
        <div class="text-gray-500 text-sm">
          &copy; ${new Date().getFullYear()} Star Trek Timelines
        </div>
      </div>
    </div>
  </footer>
  
  <!-- Simple stars animation script -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const starsContainer = document.querySelector('.stars-bg');
      if (!starsContainer) return;
      
      // Create stars
      for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        star.style.top = Math.random() * 100 + 'vh';
        star.style.left = Math.random() * 100 + 'vw';
        star.style.animationDelay = Math.random() * 10 + 's';
        starsContainer.appendChild(star);
      }
    });
  </script>
  
  <style>
    .stars-bg {
      width: 100%;
      height: 100%;
      background-color: var(--space-black);
      position: relative;
    }
    
    .star {
      position: absolute;
      width: 2px;
      height: 2px;
      background-color: white;
      border-radius: 50%;
      animation: twinkle 5s infinite;
    }
    
    @keyframes twinkle {
      0% { opacity: 0.3; }
      50% { opacity: 1; }
      100% { opacity: 0.3; }
    }
  </style>
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