// Utility functions
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get initial data from payload
    const payload = JSON.parse(document.getElementById('initial-payload').textContent);
    const PAGE_SIZE = payload.pageSize;
    
    // Initialize state
    let isLoading = false;
    let currentPage = 1;
    let totalPages = payload.totalPages;
    let totalCharacters = payload.totalCharacters;
    let currentFilters = {};

    // DOM Elements
    const speciesFilter = document.getElementById('species-filter');
    const rankFilter = document.getElementById('rank-filter');
    const importantBox = document.getElementById('important-filter');
    const keepBox = document.getElementById('keep-filter');
    const searchInput = document.getElementById('search-input');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageNum = document.getElementById('current-page-num');
    const totalNum = document.getElementById('total-pages');
    const countBadge = document.getElementById('characters-count');
    const container = document.getElementById('characters-container');
    const noResults = document.getElementById('no-results');

    // Function to render character cards
    function renderCharacters(characters) {
      container.innerHTML = characters.map(char => `
        <div class="character-card group relative bg-space-black border border-starfleet-blue rounded-lg overflow-hidden hover:border-starfleet-gold transition-colors">
          <a href="/characters/${char.uid}/" class="block">
            <div class="aspect-square overflow-hidden">
              <img
                src="${char.wikiImage || char.image || '/images/generic-character.jpg'}"
                alt="${char.name}"
                class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                onerror="this.onerror=null; this.src='/images/generic-character.jpg';"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-white mb-1">${char.name}</h3>
              ${char.title ? `<p class="text-starfleet-gold text-sm">${char.title}</p>` : ''}
              ${char.characterSpecies?.length ?
                `<p class="text-gray-400 text-sm">${char.characterSpecies.map(s => s.name).join(', ')}</p>` :
                (char.species?.length ?
                  `<p class="text-gray-400 text-sm">${char.species.map(s => s.name).join(', ')}</p>` :
                  '')}
            </div>
          </a>
        </div>
      `).join('');
    }

    // Function to update UI elements
    function updatePaginationUI() {
      if (pageNum) pageNum.textContent = String(currentPage);
      if (totalNum) totalNum.textContent = String(totalPages);
      if (prevBtn) prevBtn.disabled = currentPage <= 1 || isLoading;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages || isLoading;
      if (countBadge) countBadge.textContent = `${totalCharacters} characters`;
    }

    // Function to get current filter values
    function getCurrentFilters() {
      return {
        species: speciesFilter?.value !== 'all' ? speciesFilter?.value : undefined,
        title: rankFilter?.value !== 'all' ? rankFilter?.value : undefined,
        important: importantBox?.checked,
        keep: keepBox?.checked,
        name: searchInput?.value?.trim() || undefined
      };
    }

    // Function to fetch and apply filters
    async function applyFiltersAndFetch() {
      try {
        isLoading = true;
        container.style.opacity = '0.5';
        
        currentPage = 1; // Reset to first page when filters change
        currentFilters = getCurrentFilters();
        
        const result = await loadCharacters(currentPage, currentFilters);
        
        totalPages = result.page.totalPages;
        totalCharacters = result.page.totalElements;
        
        renderCharacters(result.characters);
        updatePaginationUI();
        
        if (result.characters.length === 0) {
          container.classList.add('hidden');
          noResults.classList.remove('hidden');
        } else {
          container.classList.remove('hidden');
          noResults.classList.add('hidden');
        }
      } catch (error) {
        console.error('Error applying filters:', error);
        container.innerHTML = '<p class="text-center text-red-500 col-span-full">Error filtering characters. Please try again.</p>';
      } finally {
        isLoading = false;
        container.style.opacity = '1';
      }
    }

    // Function to fetch a specific page
    async function fetchPageIfNeeded(pageNumber) {
      if (isLoading) return;

      try {
        isLoading = true;
        container.style.opacity = '0.5';

        const result = await loadCharacters(pageNumber, currentFilters);
        
        currentPage = pageNumber;
        totalPages = result.page.totalPages;
        totalCharacters = result.page.totalElements;
        
        renderCharacters(result.characters);
        updatePaginationUI();
      } catch (error) {
        console.error('Error fetching page:', error);
        container.innerHTML = '<p class="text-center text-red-500 col-span-full">Error loading characters. Please try again.</p>';
      } finally {
        isLoading = false;
        container.style.opacity = '1';
      }
    }

    // Event Listeners
    prevBtn?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchPageIfNeeded(currentPage);
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchPageIfNeeded(currentPage);
      }
    });

    speciesFilter?.addEventListener('change', () => applyFiltersAndFetch());
    rankFilter?.addEventListener('change', () => applyFiltersAndFetch());
    importantBox?.addEventListener('change', () => applyFiltersAndFetch());
    keepBox?.addEventListener('change', () => applyFiltersAndFetch());
    searchInput?.addEventListener('input', debounce(() => applyFiltersAndFetch(), 300));

    // Initial render
    renderCharacters(payload.characters);
    updatePaginationUI();

  } catch (error) {
    console.error('Error initializing character list:', error);
    const container = document.getElementById('characters-container');
    if (container) {
      container.innerHTML = '<p class="text-center text-red-500 col-span-full">Error initializing character list. Please refresh the page.</p>';
    }
  }
});