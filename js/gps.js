/**
 * gps.js — GPS simulation mode + first-visit onboarding
 */

import { displayFloor, STORAGE_KEY } from './config.js';
import { state } from './state.js';
import { populateDropdowns } from './markers.js';
import { updateFloatingHint } from './selection.js';
import { findRoute } from './route.js';
import { renderIcons } from './icons.js';

const GPS_ASKED_KEY = 'hci-t3-gps-asked';

function createGpsMarker(node) {
  const icon = L.divIcon({
    className: 'gps-marker',
    html: '<div class="gps-dot"></div>',
    iconSize: [0, 0],
    iconAnchor: [7, 7],
  });

  return L.marker([node.y, node.x], {
    icon,
    interactive: false,
  });
}

function updateGpsStatus() {
  const status = document.getElementById('gps-status');
  if (!status) return;
  if (!state.gpsNode) {
    status.classList.add('hidden');
    status.textContent = '';
    return;
  }
  status.textContent = `Vị trí: T${displayFloor(state.gpsNode.floor)} • (${state.gpsNode.x}, ${state.gpsNode.y})`;
  status.classList.remove('hidden');
}

export function setGpsLocation(latlng) {
  const x = Math.round(latlng.lng);
  const y = Math.round(latlng.lat);
  state.gpsNode = {
    id: 'gps',
    label: '📡 Vị trí hiện tại',
    x,
    y,
    floor: state.currentFloor,
    links: [],
  };

  if (!state.gpsMarker) {
    state.gpsMarker = createGpsMarker(state.gpsNode);
  }
  state.gpsMarker.setLatLng([state.gpsNode.y, state.gpsNode.x]);
  if (state.gpsMode && state.gpsNode.floor === state.currentFloor) {
    state.gpsMarker.addTo(state.map);
  }

  updateGpsStatus();
  populateDropdowns();

  const fromSelect = document.getElementById('from-select');
  if (fromSelect) {
    fromSelect.value = 'gps';
  }

  // Update selection state
  state.selectedFrom = state.gpsNode;
  state.selectionMode = 'to';
  updateFloatingHint();

  const toId = document.getElementById('to-select').value;
  if (toId) {
    findRoute();
  }
}

export function setGpsMode(enabled) {
  state.gpsMode = enabled;

  // Sync GPS toggle button
  const gpsBtn = document.getElementById('gps-toggle-btn');
  if (gpsBtn) gpsBtn.classList.toggle('active', enabled);

  // Sync old checkbox
  const gpsCheckbox = document.getElementById('gps-mode-toggle');
  if (gpsCheckbox) gpsCheckbox.checked = enabled;
  const hint = document.getElementById('gps-mode-hint');
  if (hint) hint.classList.toggle('hidden', !state.gpsMode);

  const fromSelect = document.getElementById('from-select');
  if (fromSelect) {
    fromSelect.disabled = state.gpsMode;
  }

  if (!state.gpsMode) {
    if (state.gpsMarker) state.map.removeLayer(state.gpsMarker);
    state.gpsMarker = null;
    state.gpsNode = null;
    state.selectionMode = 'from';
    state.selectedFrom = null;
    updateGpsStatus();
    populateDropdowns();
    updateFloatingHint();
    if (fromSelect && fromSelect.value === 'gps') fromSelect.value = '';
    return;
  }

  if (!state.gpsNode) {
    setGpsLocation(state.map.getCenter());
  } else if (state.gpsNode.floor === state.currentFloor && state.gpsMarker) {
    state.gpsMarker.addTo(state.map);
  }
  if (fromSelect) {
    fromSelect.value = 'gps';
  }

  // GPS mode: from is locked, user only picks destination
  state.selectedFrom = state.gpsNode;
  state.selectionMode = 'to';
  updateFloatingHint();
}

// --- First-visit GPS onboarding ---
export function requestGpsPermission() {
  // Already asked before? Skip.
  if (localStorage.getItem(GPS_ASKED_KEY)) return;

  const overlay = document.getElementById('gps-onboarding');
  if (!overlay) return;

  // Show overlay with animation
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    renderIcons();
  });

  const allowBtn = document.getElementById('gps-allow-btn');
  const skipBtn = document.getElementById('gps-skip-btn');

  function dismiss() {
    overlay.classList.remove('visible');
    localStorage.setItem(GPS_ASKED_KEY, '1');
    allowBtn?.removeEventListener('click', onAllow);
    skipBtn?.removeEventListener('click', onSkip);
  }

  function onAllow() {
    dismiss();
    // Enable GPS simulation at map center
    setGpsMode(true);
    // Auto-open search so user can find their destination
    import('./search.js').then(m => m.openSearchOverlay());
  }

  function onSkip() {
    dismiss();
  }

  allowBtn?.addEventListener('click', onAllow);
  skipBtn?.addEventListener('click', onSkip);
}
