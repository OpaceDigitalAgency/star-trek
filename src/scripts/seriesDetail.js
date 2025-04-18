function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

function displayEpisodes(episodes) {
  const container = document.getElementById('episodes-container');
  if (!container || !Array.isArray(episodes)) {
    container.innerHTML = '<p class="text-gray-300">No episodes available.</p>';
    return;
  }

  // Group episodes by season
  const seasons = episodes.reduce((acc, episode) => {
    const season = episode.season || 'Unknown';
    if (!acc[season]) acc[season] = [];
    acc[season].push(episode);
    return acc;
  }, {});

  // Sort episodes within each season
  Object.values(seasons).forEach(seasonEpisodes => {
    seasonEpisodes.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
  });

  // Generate HTML
  const html = Object.entries(seasons)
    .sort(([a], [b]) => a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : parseInt(a) - parseInt(b))
    .map(([season, episodes]) => `
      <div class="season-section">
        <h3 class="season-header text-xl text-starfleet-gold">Season ${season}</h3>
        <div class="space-y-2">
          ${episodes.map(episode => `
            <div class="episode-grid">
              <span class="episode-number">${episode.episodeNumber || '?'}</span>
              <span class="episode-title">${episode.title || 'Unknown Episode'}</span>
              <span class="episode-date">${formatDate(episode.airDate)}</span>
              <span class="episode-stardate">${episode.stardate || 'Unknown'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

  container.innerHTML = html;
}

function updateUI(series) {
  // Update basic info
  document.getElementById('series-title').textContent = series.title;
  
  // Update image
  const seriesImage = document.getElementById('series-image');
  const imagePath = series.wikiImage || series.image || "/images/stars-placeholder.jpg";
  seriesImage.src = imagePath;
  seriesImage.alt = series.title;
  seriesImage.onerror = () => {
    if (imagePath !== "/images/stars-placeholder.jpg") {
      seriesImage.src = "/images/stars-placeholder.jpg";
    }
  };

  // Update metadata
  document.getElementById('series-abbreviation').textContent = series.abbreviation || "N/A";
  document.getElementById('series-years').textContent = series.years || "Unknown";
  document.getElementById('series-stardate').textContent = series.stardate || "Unknown";
  document.getElementById('series-seasons').textContent = series.seasonsCount || "?";
  document.getElementById('series-episodes').textContent = series.episodesCount || series.episodes?.length || "?";
  document.getElementById('series-network').textContent = series.originalNetwork || "Various";
  document.getElementById('series-production').textContent =
    typeof series.productionCompany === 'object' ? series.productionCompany?.name || "Paramount" : series.productionCompany || "Paramount";

  // Update description
  document.getElementById('series-description').innerHTML =
    series.wikiSummary || series.description || `${series.title} is a Star Trek series that aired from ${series.years}.`;

  // Update timeline info
  let timelineText = `${series.title} is set `;
  if (series.stardate && series.stardate !== "Unknown") {
    timelineText += `in the years ${series.stardate}, `;
  }
  
  const era = series.title.includes("Original") ? "Five-Year Mission" :
              series.title.includes("Next Generation") ? "24th century" :
              series.title.includes("Deep Space Nine") ? "Dominion War era" :
              series.title.includes("Voyager") ? "Delta Quadrant expedition" :
              series.title.includes("Enterprise") ? "early days of Starfleet" :
              series.title.includes("Picard") ? "post-Dominion War era" :
              "Star Trek timeline";
  timelineText += `during the ${era}.`;
  
  document.getElementById('series-timeline-info').textContent = timelineText;

  // Update wiki link
  const wikiLink = document.getElementById('series-wiki-link');
  if (series.wikiUrl) {
    wikiLink.href = series.wikiUrl;
    wikiLink.classList.remove('hidden');
  } else {
    wikiLink.classList.add('hidden');
  }

  // Display episodes
  if (series.episodes && Array.isArray(series.episodes)) {
    displayEpisodes(series.episodes);
  }
}

function showError(error) {
  console.error('Error:', error);
  document.getElementById('series-title').textContent = "Error loading series data";
  document.getElementById('series-description').innerHTML = `
    <p>Could not load series information. Please try again later.</p>
    <p class="text-sm text-red-500 mt-2">Error: ${error.message}</p>
  `;
  document.getElementById('series-image').classList.add('hidden');
  document.querySelector('.series-meta').classList.add('hidden');
  document.querySelector('.timeline-info').classList.add('hidden');
  document.getElementById('series-wiki-link').classList.add('hidden');
  document.getElementById('episodes-container').innerHTML = '<p class="text-red-500">Failed to load episodes.</p>';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const slug = window.location.pathname.split('/').filter(Boolean).pop();
  
  if (!slug || slug === 'series') {
    if (window.location.pathname !== '/series/' && window.location.pathname !== '/series') {
      window.location.href = '/series/';
    }
    return;
  }

  fetch(`/api/series/${slug}`)
    .then(function(response) {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(function(series) {
      updateUI(series);
    })
    .catch(function(error) {
      showError(error);
    });
});