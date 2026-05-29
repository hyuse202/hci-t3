/**
 * markers.js — POI marker creation, placement, dropdowns
 */

import { displayFloor } from './config.js';
import { state } from './state.js';
import { CATEGORY_KEYWORDS, SAMPLE_POIS } from './data.js';
import { selectPOI } from './selection.js';
import { deleteCustomNode, saveCustomNodes, savePoiPosition } from './custom-nodes.js';
import { switchFloor } from './map.js';
import { CATEGORY_ICONS, renderIcons } from './icons.js';

// --- Get all nodes (mẫu + custom) ---
export function getAllNodes() {
  const combined = [...SAMPLE_POIS];
  state.customNodes.forEach(n => {
    if (!combined.find(c => c.id === n.id)) {
      combined.push(n);
    }
  });
  if (state.gpsNode) {
    combined.push(state.gpsNode);
  }
  return combined;
}

const CATEGORY_COLORS = {
  gate: '#ff385c',
  lounge: '#6f4cff',
  wc: '#1e88e5',
  elevator: '#222222',
  escalator: '#00a699',
  food: '#f59f00',
  baggage: '#4c6ef5',
  smoke: '#6a6a6a',
  checkin: '#0ea5e9',
  stairs: '#4b5563',
  custom: '#6a6a6a',
  other: '#222222',
};

function normalizeText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function matchesCategory(normalizedLabel, keywords) {
  return keywords.some(keyword => normalizedLabel.includes(normalizeText(keyword)));
}

function getCategoryForLabel(label) {
  const trimmed = label.trim();
  const normalized = normalizeText(trimmed);

  if (/^(a|d)\d+/i.test(trimmed)) return 'gate';
  if (normalized.includes('thang bo')) return 'stairs';
  if (normalized.includes('thu tuc')) return 'checkin';

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (matchesCategory(normalized, keywords)) return category;
  }

  return 'other';
}

// --- Create Marker for a POI ---
export function createPOIMarker(node, map) {
  if (node.id === 'gps') return null;

  const isCustom = node.id.startsWith('custom-');

  const shortLabel = node.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '').trim();
  const category = isCustom ? 'custom' : getCategoryForLabel(shortLabel || node.label);
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const lucideName = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;

  const icon = L.divIcon({
    className: 'poi-marker',
    html: `
      <div class="poi-pill${isCustom ? ' is-custom' : ''}" style="--poi-color: ${color};" data-node-id="${node.id}" data-label="${shortLabel}">
        <span class="pill-icon"><i data-lucide="${lucideName}"></i></span>
        <span class="pill-label">${shortLabel}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const marker = L.marker([node.y, node.x], {
    icon,
    draggable: false,
  });

  marker.nodeId = node.id;
  marker._poiData = node;
  marker._isCustom = isCustom;

  // Click để chọn
  marker.on('click', (e) => {
    L.DomEvent.stopPropagation(e);

    if (state.editMode) return;

    // Toggle expand
    document.querySelectorAll('.poi-pill.expanded').forEach(el => {
      if (el.dataset.nodeId !== node.id) el.classList.remove('expanded');
    });
    const pillEl = document.querySelector(`.poi-pill[data-node-id="${node.id}"]`);
    if (pillEl) {
      pillEl.classList.add('expanded');
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
  });

  // Right-click để xoá (chỉ custom node)
  if (isCustom) {
    marker.on('contextmenu', (e) => {
      L.DomEvent.stopPropagation(e);
      if (confirm(`Xoá "${node.label}" khỏi bản đồ?`)) {
        deleteCustomNode(node.id);
      }
    });
  }

  // Kéo thả để điều chỉnh vị trí
  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    const newX = Math.round(pos.lng);
    const newY = Math.round(pos.lat);

    const poi = SAMPLE_POIS.find(p => p.id === node.id);
    if (poi) {
      poi.x = newX;
      poi.y = newY;
      savePoiPosition(node.id, newX, newY);
    }

    const customNode = state.customNodes.find(n => n.id === node.id);
    if (customNode) {
      customNode.x = newX;
      customNode.y = newY;
      saveCustomNodes();
    }

    marker._poiData = { ...marker._poiData, x: newX, y: newY };
    console.log(`📍 ${node.label} → x: ${newX}, y: ${newY} (T${displayFloor(node.floor)})`);
  });

  state.markerRefs[node.id] = { marker, node };
  return marker;
}

// --- Place all POI markers ---
export function placeMarkers(map) {
  const allNodes = getAllNodes();

  allNodes.forEach(node => {
    if (node.id === 'gps') return;
    if (!state.markerLayers[node.floor]) state.markerLayers[node.floor] = [];
    const marker = createPOIMarker(node, map);
    if (!marker) return;
    state.markerLayers[node.floor].push(marker);

    if (node.floor === state.currentFloor) {
      marker.addTo(map);
    }
  });

  // Render Lucide icons inside marker pills
  renderIcons();
}

// --- Refresh all markers ---
export function refreshMarkers() {
  Object.keys(state.markerLayers).forEach(f => {
    state.markerLayers[f].forEach(m => state.map.removeLayer(m));
  });
  state.markerLayers = {};
  placeMarkers(state.map);
  renderIcons();
}

// --- Populate dropdowns ---
export function populateDropdowns() {
  const fromSelect = document.getElementById('from-select');
  const toSelect = document.getElementById('to-select');
  const allNodes = getAllNodes();

  fromSelect.innerHTML = '<option value="">— Chọn điểm đi —</option>';
  toSelect.innerHTML = '<option value="">— Chọn điểm đến —</option>';

  if (state.gpsNode) {
    const gpsOpt = document.createElement('option');
    gpsOpt.value = 'gps';
    gpsOpt.textContent = '📡 Vị trí hiện tại';
    fromSelect.appendChild(gpsOpt);
  }

  allNodes.forEach(node => {
    if (node.id === 'gps') return;
    const opt1 = document.createElement('option');
    opt1.value = node.id;
    opt1.textContent = `[T${displayFloor(node.floor)}] ${node.label}`;
    fromSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = node.id;
    opt2.textContent = `[T${displayFloor(node.floor)}] ${node.label}`;
    toSelect.appendChild(opt2);
  });

  if (state.gpsMode && state.gpsNode) {
    fromSelect.value = 'gps';
    fromSelect.disabled = true;
  }
}
