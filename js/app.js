/**
 * app.js — Entry point: init, event wiring, public API
 *
 * Đây là file duy nhất load từ HTML. Tất cả logic nằm trong các module riêng.
 */

import { CONFIG } from './config.js';
import { state } from './state.js';
import { initMap, createFloorLayers, createPlaceholderLayers, switchFloor, checkImagesExist } from './map.js';
import { placeMarkers, populateDropdowns, refreshMarkers, getAllNodes } from './markers.js';
import { findRoute } from './route.js';
import { clearRoute, clearSelection } from './selection.js';
import { addCustomNode, deleteCustomNode, exportCoords, loadCustomNodes, loadPoiPositions, saveCustomNodes, renderCustomPointsList } from './custom-nodes.js';
import { setGpsMode } from './gps.js';
import { setupPanelToggle, autoOpenPanel } from './ui.js';
import { registerServiceWorker } from './sw-register.js';
import { setupSearchEvents } from './search.js';

function init() {
  state.map = initMap();
  createFloorLayers(state.map);

  // Khôi phục điểm đã lưu
  loadCustomNodes();
  loadPoiPositions();

  // Đặt POI markers
  placeMarkers(state.map);
  populateDropdowns();
  renderCustomPointsList();
  setupPanelToggle();
  registerServiceWorker();

  // Floor switch events
  document.querySelectorAll('.floor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const floor = parseInt(btn.dataset.floor);
      switchFloor(floor);
    });
  });

  // Route buttons
  document.getElementById('find-route-btn').addEventListener('click', findRoute);
  document.getElementById('clear-route-btn').addEventListener('click', clearRoute);

  // Edit mode toggle
  document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
    state.editMode = e.target.checked;
    document.getElementById('edit-mode-hint').classList.toggle('hidden', !state.editMode);
  });

  // GPS mode toggle
  const gpsToggleBtn = document.getElementById('gps-toggle-btn');
  if (gpsToggleBtn) {
    gpsToggleBtn.addEventListener('click', () => {
      const newState = !state.gpsMode;
      setGpsMode(newState);
      gpsToggleBtn.classList.toggle('active', newState);
    });
  }

  const gpsToggleOld = document.getElementById('gps-mode-toggle');
  if (gpsToggleOld) {
    gpsToggleOld.addEventListener('change', (e) => {
      setGpsMode(e.target.checked);
      if (gpsToggleBtn) gpsToggleBtn.classList.toggle('active', e.target.checked);
    });
  }

  // Click on map to add node
  state.map.on('click', addCustomNode);

  // Xoá tất cả custom nodes
  document.getElementById('clear-all-points-btn').addEventListener('click', () => {
    if (state.customNodes.length === 0) return;
    if (confirm(`Xoá tất cả ${state.customNodes.length} điểm đã đánh dấu?`)) {
      state.customNodes.forEach(n => {
        const ref = state.markerRefs[n.id];
        if (ref && ref.marker) state.map.removeLayer(ref.marker);
      });
      Object.keys(state.markerLayers).forEach(f => {
        state.markerLayers[f] = state.markerLayers[f].filter(m => m.nodeId && !m.nodeId.startsWith('custom-'));
      });
      state.customNodes = [];
      Object.keys(state.markerRefs).forEach(k => {
        if (k.startsWith('custom-')) delete state.markerRefs[k];
      });
      saveCustomNodes();
      populateDropdowns();
      renderCustomPointsList();
      clearRoute();
    }
  });

  // Xuất tọa độ
  document.getElementById('export-coords-btn').addEventListener('click', exportCoords);

  // Dropdown auto-find route
  document.getElementById('from-select').addEventListener('change', () => {
    const from = document.getElementById('from-select').value;
    const to = document.getElementById('to-select').value;
    if (from && to) findRoute();
  });

  document.getElementById('to-select').addEventListener('change', () => {
    const from = document.getElementById('from-select').value;
    const to = document.getElementById('to-select').value;
    if (from && to) findRoute();
  });

  // Search events
  setupSearchEvents();

  // Route card drag-to-dismiss
  const routeCard = document.getElementById('route-card');
  if (routeCard) {
    let touchStartY = 0;
    let cardTranslateY = 0;

    routeCard.addEventListener('touchstart', (e) => {
      if (e.target.closest('.drag-handle')) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    routeCard.addEventListener('touchmove', (e) => {
      if (touchStartY === 0) return;
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 0) {
        cardTranslateY = dy;
        routeCard.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });

    routeCard.addEventListener('touchend', () => {
      if (cardTranslateY > 80) {
        clearSelection();
      }
      routeCard.style.transform = '';
      touchStartY = 0;
      cardTranslateY = 0;
    }, { passive: true });
  }

  // Click on map (empty area) to dismiss selection hint on desktop
  state.map.on('click', (e) => {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) return;

    const allNodes = getAllNodes().filter(n => n.id !== 'gps');
    let nearPOI = false;
    for (const poi of allNodes) {
      const dx = e.latlng.lng - poi.x;
      const dy = e.latlng.lat - poi.y;
      if (Math.sqrt(dx * dx + dy * dy) < 50) {
        nearPOI = true;
        break;
      }
    }

    if (!nearPOI && !state.selectedFrom && !state.selectedTo) {
      // updateFloatingHint() — currently a no-op
    }
  });

  console.log('✅ App ready! Current floor:', state.currentFloor);
  console.log('📌 Cách đánh tọa độ:');
  console.log('   1. Bật "Chế độ đánh dấu"');
  console.log('   2. Click vào bản đồ để thêm điểm');
  console.log('   3. Xem tọa độ trong console (F12)');
}

// --- Public API cho console ---
window.App = {
  switchFloor,
  findRoute,
  clearRoute,
  clearSelection,
  addCustomNode,
  deleteCustomNode,
  exportCoords,
  refreshMarkers,
  renderCustomPointsList,
  getCurrentFloor: () => state.currentFloor,
  getCustomNodes: () => state.customNodes,
  getAllNodes,
  getSelectedFrom: () => state.selectedFrom,
  getSelectedTo: () => state.selectedTo,
};

// Khởi chạy khi page load xong
document.addEventListener('DOMContentLoaded', init);
