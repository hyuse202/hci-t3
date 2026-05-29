/**
 * markers.js — POI marker creation, placement, dropdowns
 */

import { displayFloor } from './config.js';
import { state } from './state.js';
import { SAMPLE_POIS } from './data.js';
import { selectPOI } from './selection.js';
import { deleteCustomNode, saveCustomNodes, savePoiPosition } from './custom-nodes.js';
import { switchFloor } from './map.js';

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

// --- Create Marker for a POI ---
export function createPOIMarker(node, map) {
  if (node.id === 'gps') return null;
  const color = node.floor === 1 ? '#ff6b35'
             : node.floor === 2 ? '#0066cc'
             : '#28a745';

  const isCustom = node.id.startsWith('custom-');

  const iconEmoji = node.label.match(/^[\p{Emoji}\p{Emoji_Component}]+/u)?.[0] || '📍';
  const shortLabel = node.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '');

  const icon = L.divIcon({
    className: 'poi-marker',
    html: `
      <div class="poi-pill${isCustom ? ' is-custom' : ''}" style="--poi-color: ${color};" data-node-id="${node.id}" data-label="${shortLabel}">
        <span class="pill-icon">${iconEmoji}</span>
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
}

// --- Refresh all markers ---
export function refreshMarkers() {
  Object.keys(state.markerLayers).forEach(f => {
    state.markerLayers[f].forEach(m => state.map.removeLayer(m));
  });
  state.markerLayers = {};
  placeMarkers(state.map);
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
