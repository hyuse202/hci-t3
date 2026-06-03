/**
 * search.js — Search overlay, category chips, search results
 */

import { displayFloor, WALKING_SPEED } from './config.js';
import { state } from './state.js';
import { getAllNodes, getCategoryForLabel } from './markers.js';
import { CATEGORY_KEYWORDS } from './data.js';
import { switchFloor } from './map.js';
import { handleMobileTap } from './selection.js';
import { FLOOR_ICONS, renderIcons } from './icons.js';
import { buildGraph, aStar } from './pathfinding.js';

// --- Search POIs ---
export function searchPOIs(query, category) {
  const q = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const allNodes = getAllNodes();

  let filtered = allNodes.filter(poi => {
    if (poi.id === 'gps') return false;

    // Chuẩn hóa nhãn để tìm kiếm không dấu
    const cleanLabel = poi.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '').trim();
    const labelLower = cleanLabel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const matchesQuery = !q || labelLower.includes(q);

    // Sử dụng hàm phân loại đồng bộ getCategoryForLabel từ markers.js
    const nodeCat = getCategoryForLabel(cleanLabel || poi.label);
    const matchesCat = !category || nodeCat === category;

    return matchesQuery && matchesCat;
  });

  // Nếu người dùng bật GPS giả lập, tính khoảng cách thực tế và sắp xếp theo độ gần
  if (state.gpsMode && state.gpsNode) {
    const graph = buildGraph(allNodes);

    filtered.forEach(poi => {
      // Tìm đường đi thực tế bằng A* từ vị trí GPS đến đích
      const path = aStar(graph, 'gps', poi.id);
      if (path) {
        // Tính tổng quãng đường
        let totalWeight = 0;
        for (let i = 0; i < path.length - 1; i++) {
          const edge = graph[path[i]]?.edges.find(e => e.to === path[i + 1]);
          if (edge) totalWeight += edge.weight;
        }
        poi.distanceFromGps = totalWeight;
      } else {
        poi.distanceFromGps = Infinity;
      }
    });

    // Sắp xếp tăng dần theo độ dài quãng đường đi bộ thực tế
    filtered.sort((a, b) => a.distanceFromGps - b.distanceFromGps);
  } else {
    // Reset thuộc tính khoảng cách nếu tắt GPS
    filtered.forEach(poi => {
      poi.distanceFromGps = undefined;
    });
  }

  return filtered.slice(0, 10);
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
    
    // Hiển thị thông tin khoảng cách & số phút đi bộ nếu đang bật GPS
    let floorText = `Tầng ${displayFloor(poi.floor)}`;
    if (state.gpsMode && state.gpsNode && poi.distanceFromGps !== undefined && poi.distanceFromGps !== Infinity) {
      const timeMin = Math.round(poi.distanceFromGps / WALKING_SPEED);
      const displayTime = timeMin > 0 ? `~${timeMin} phút` : '< 1 phút';
      floorText = `Tầng ${displayFloor(poi.floor)} • 🚶‍♂️ ${poi.distanceFromGps}m (${displayTime})`;
    }

    return `
      <div class="search-result-item" data-node-id="${poi.id}">
        <div class="result-icon"><i data-lucide="${floorIcons[poi.floor] || 'map-pin'}"></i></div>
        <div class="result-info">
          <div class="result-label">${cleanLabel}</div>
          <div class="result-floor">${floorText}</div>
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
  document.body.classList.add('search-open');
  if (overlay) overlay.classList.add('visible');
  if (input) {
    input.value = '';
    input.focus();
  }
  // Khởi tạo hiển thị kết quả ban đầu
  showSearchResults(getAllNodes().filter(n => n.id !== 'gps').slice(0, 8));
  state.activeCategory = null;
  document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
}

// --- Close search overlay ---
export function closeSearchOverlay() {
  const overlay = document.getElementById('mobile-search');
  document.body.classList.remove('search-open');
  if (overlay) overlay.classList.remove('visible');
  state.activeCategory = null;
}

// --- Setup search event listeners ---
export function setupSearchEvents() {
  // Nút mở tìm kiếm
  const searchTrigger = document.getElementById('mobile-search-trigger');
  if (searchTrigger) {
    searchTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openSearchOverlay();
    });
  }

  // Nút đóng tìm kiếm
  const searchClose = document.getElementById('search-close');
  if (searchClose) {
    searchClose.addEventListener('click', closeSearchOverlay);
  }

  // Ô nhập văn bản tìm kiếm
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const results = searchPOIs(query, state.activeCategory);
      showSearchResults(results);
    });
  }

  // Bộ lọc danh mục (chips)
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

  // Chọn kết quả tìm kiếm
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      handleSearchResultTap(item.dataset.nodeId);
    });
  }

  // Đóng khi click ra ngoài
  document.addEventListener('click', (e) => {
    const overlay = document.getElementById('mobile-search');
    if (overlay && overlay.classList.contains('visible')) {
      if (!overlay.contains(e.target) && !searchTrigger?.contains(e.target)) {
        closeSearchOverlay();
      }
    }
  });

  // Đóng khi bấm phím ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSearchOverlay();
    }
  });
}
