/**
 * selection.js — POI selection, highlighting, auto-route
 */

import { state } from './state.js';
import { getAllNodes } from './markers.js';
import { buildGraph, aStar } from './pathfinding.js';
import { drawPath, showRouteCard, hideRouteCard } from './route.js';
import { switchFloor } from './map.js';

// --- Handle mobile tap on POI ---
export function handleMobileTap(node) {
  if (state.editMode) return;

  // Bounce animation
  const pillEl = document.querySelector(`.poi-pill[data-node-id="${node.id}"]`);
  if (pillEl) {
    pillEl.classList.remove('tapped');
    void pillEl.offsetWidth;
    pillEl.classList.add('tapped');
  }

  // Switch floor nếu POI ở tầng khác
  if (node.floor !== state.currentFloor) {
    switchFloor(node.floor);
  }

  // GPS mode: always set as destination
  if (state.gpsMode && state.gpsNode) {
    selectPOI(node, 'to');
    return;
  }

  if (state.selectionMode === 'from') {
    selectPOI(node, 'from');
  } else {
    selectPOI(node, 'to');
  }
}

// --- Select a POI as from or to ---
export function selectPOI(node, type) {
  clearMarkerHighlight(type);

  if (type === 'from') {
    state.selectedFrom = node;
    state.selectionMode = 'to';
  } else {
    state.selectedTo = node;
  }

  highlightMarker(node.id, type);
  updateFloatingHint();

  // Sync dropdowns
  if (type === 'from') {
    document.getElementById('from-select').value = node.id;
  } else {
    document.getElementById('to-select').value = node.id;
  }

  // Auto-find route nếu cả 2 đã chọn
  if (state.selectedFrom && state.selectedTo) {
    if (state.selectedFrom.id === state.selectedTo.id) {
      clearSelection();
      return;
    }
    autoFindRoute();
  }
}

// --- Highlight marker ---
export function highlightMarker(nodeId, type) {
  const pillEl = document.querySelector(`.poi-pill[data-node-id="${nodeId}"]`);
  if (pillEl) {
    pillEl.classList.add(type === 'from' ? 'selected-from' : 'selected-to');
  }
}

// --- Clear marker highlight ---
export function clearMarkerHighlight(type) {
  const cls = type === 'from' ? 'selected-from' : 'selected-to';
  document.querySelectorAll(`.poi-pill.${cls}`).forEach(el => {
    el.classList.remove(cls);
  });
}

// --- Clear entire selection ---
export function clearSelection() {
  clearMarkerHighlight('from');
  clearMarkerHighlight('to');
  state.selectedFrom = null;
  state.selectedTo = null;
  state.selectionMode = 'from';

  // Clear path
  if (state.currentPathLayer) {
    state.map.removeLayer(state.currentPathLayer);
    state.currentPathLayer = null;
  }
  state.currentPath = null;

  // Reset dropdowns
  if (state.gpsMode && state.gpsNode) {
    document.getElementById('from-select').value = 'gps';
  } else {
    document.getElementById('from-select').value = '';
  }
  document.getElementById('to-select').value = '';
  document.getElementById('route-info').classList.add('hidden');

  hideRouteCard();
  updateFloatingHint();
}

// --- Auto find route ---
export function autoFindRoute() {
  const allNodes = getAllNodes();
  const g = buildGraph(allNodes);
  const path = aStar(g, state.selectedFrom.id, state.selectedTo.id);

  if (!path) {
    showRouteCard(null, null);
    return;
  }

  state.currentPath = path;
  drawPath(path);
  showRouteCard(path, g);
  updateFloatingHint();
}

// --- Update floating hint text ---
export function updateFloatingHint() {}

// --- Clear route (alias) ---
export function clearRoute() {
  clearSelection();
}
