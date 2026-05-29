/**
 * search.js — Search overlay, category chips, search results
 */

import { displayFloor } from './config.js';
import { state } from './state.js';
import { getAllNodes } from './markers.js';
import { CATEGORY_KEYWORDS } from './data.js';
import { switchFloor } from './map.js';
import { handleMobileTap } from './selection.js';
import { FLOOR_ICONS, renderIcons } from './icons.js';

// --- Search POIs ---
export function searchPOIs(query, category) {
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const allNodes = getAllNodes();

  return allNodes.filter(poi => {
    if (poi.id === 'gps') return false;

    const label = poi.label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const matchesQuery = !q || label.includes(q);
    const matchesCat = !category || (CATEGORY_KEYWORDS[category] || []).some(kw => label.includes(kw));

    return matchesQuery && matchesCat;
  }).slice(0, 10);
}

// --- Show search results ---
export function showSearchResults(results) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = '<div class="search-empty">Không tìm thấy địa điểm</div>';
    return;
  }

  const floorIcons = FLOOR_ICONS;

  container.innerHTML = results.map(poi => {
    const cleanLabel = poi.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '') || poi.label;
    return `
      <div class="search-result-item" data-node-id="${poi.id}">
        <div class="result-icon"><i data-lucide="${floorIcons[poi.floor] || 'map-pin'}"></i></div>
        <div class="result-info">
          <div class="result-label">${cleanLabel}</div>
          <div class="result-floor">Tầng ${displayFloor(poi.floor)}</div>
        </div>
      </div>
    `;
  }).join('');
  renderIcons();
}

// --- Handle search result tap ---
function handleSearchResultTap(nodeId) {
  const allNodes = getAllNodes();
  const node = allNodes.find(n => n.id === nodeId);
  if (!node) return;

  closeSearchOverlay();

  if (node.floor !== state.currentFloor) {
    switchFloor(node.floor);
  }

  handleMobileTap(node);
}

// --- Open search overlay ---
export function openSearchOverlay() {
  const overlay = document.getElementById('mobile-search');
  const input = document.getElementById('search-input');
  if (overlay) overlay.classList.add('visible');
  if (input) {
    input.value = '';
    input.focus();
  }
  // Show all POIs initially
  showSearchResults(getAllNodes().filter(n => n.id !== 'gps').slice(0, 8));
  state.activeCategory = null;
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
}

// --- Close search overlay ---
export function closeSearchOverlay() {
  const overlay = document.getElementById('mobile-search');
  if (overlay) overlay.classList.remove('visible');
  state.activeCategory = null;
}

// --- Setup search event listeners ---
export function setupSearchEvents() {
  // Search trigger
  const searchTrigger = document.getElementById('mobile-search-trigger');
  if (searchTrigger) {
    searchTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openSearchOverlay();
    });
  }

  // Search close
  const searchClose = document.getElementById('search-close');
  if (searchClose) {
    searchClose.addEventListener('click', closeSearchOverlay);
  }

  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const results = searchPOIs(query, state.activeCategory);
      showSearchResults(results);
    });
  }

  // Category chips
  const chipsContainer = document.getElementById('category-chips');
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.category-chip');
      if (!chip) return;

      const cat = chip.dataset.cat;

      if (state.activeCategory === cat) {
        state.activeCategory = null;
        chip.classList.remove('active');
      } else {
        chipsContainer.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        state.activeCategory = cat;
        chip.classList.add('active');
      }

      const query = searchInput ? searchInput.value : '';
      const results = searchPOIs(query, state.activeCategory);
      showSearchResults(results);
    });
  }

  // Search result taps
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      handleSearchResultTap(item.dataset.nodeId);
    });
  }

  // Close search overlay on backdrop click
  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('mobile-search');
    if (overlay && overlay.classList.contains('visible')) {
      if (!overlay.contains(e.target) && !searchTrigger?.contains(e.target)) {
        closeSearchOverlay();
      }
    }
  });

  // Close search overlay on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearchOverlay();
    }
  });
}
