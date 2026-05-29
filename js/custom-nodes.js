/**
 * custom-nodes.js — Edit mode, custom POI management, localStorage, export
 */

import { displayFloor, STORAGE_KEY, POI_POS_KEY } from './config.js';
import { state } from './state.js';
import { SAMPLE_POIS } from './data.js';
import { refreshMarkers, populateDropdowns, placeMarkers } from './markers.js';
import { clearRoute } from './selection.js';
import { setGpsLocation } from './gps.js';

// --- Add custom node (click on map in edit mode) ---
export function addCustomNode(e) {
  if (state.gpsMode) {
    setGpsLocation(e.latlng);
    return;
  }
  if (!state.editMode) return;

  const latlng = e.latlng;
  const y = Math.round(latlng.lat);
  const x = Math.round(latlng.lng);

  const id = `custom-${Date.now()}`;
  const label = prompt('🏷️ Nhập tên địa điểm:', `Điểm mới #${state.customNodes.length + 1}`);
  if (!label) return;

  const newNode = {
    id,
    label: `📍 ${label}`,
    x,
    y,
    floor: state.currentFloor,
    links: [],
  };

  state.customNodes.push(newNode);
  saveCustomNodes();

  refreshMarkers();
  populateDropdowns();
  renderCustomPointsList();

  document.getElementById('from-select').value = id;
}

// --- Xoá custom node ---
export function deleteCustomNode(nodeId) {
  const ref = state.markerRefs[nodeId];
  if (ref && ref.marker) {
    state.map.removeLayer(ref.marker);
  }

  Object.keys(state.markerLayers).forEach(f => {
    state.markerLayers[f] = state.markerLayers[f].filter(m => m.nodeId !== nodeId);
  });

  state.customNodes = state.customNodes.filter(n => n.id !== nodeId);
  delete state.markerRefs[nodeId];

  saveCustomNodes();
  populateDropdowns();
  renderCustomPointsList();

  const fromSelect = document.getElementById('from-select');
  const toSelect = document.getElementById('to-select');
  if (fromSelect.value === nodeId || toSelect.value === nodeId) {
    clearRoute();
  }
}

// --- Lưu custom nodes vào localStorage ---
export function saveCustomNodes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customNodes));
  } catch(e) {
    console.warn('Không thể lưu localStorage:', e);
  }
}

// --- Load custom nodes từ localStorage ---
export function loadCustomNodes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.customNodes = parsed;
        console.log(`📦 Đã khôi phục ${state.customNodes.length} điểm từ localStorage`);
      }
    }
  } catch(e) {
    console.warn('Không thể load localStorage:', e);
  }
}

// --- Load saved POI position overrides ---
export function loadPoiPositions() {
  try {
    const saved = localStorage.getItem(POI_POS_KEY);
    if (saved) {
      const overrides = JSON.parse(saved);
      Object.keys(overrides).forEach(id => {
        const poi = SAMPLE_POIS.find(p => p.id === id);
        if (poi) {
          poi.x = overrides[id].x;
          poi.y = overrides[id].y;
        }
      });
      console.log(`📍 Đã khôi phục ${Object.keys(overrides).length} vị trí POI`);
    }
  } catch(e) {}
}

// --- Save POI position override ---
export function savePoiPosition(nodeId, x, y) {
  try {
    const saved = localStorage.getItem(POI_POS_KEY);
    const overrides = saved ? JSON.parse(saved) : {};
    overrides[nodeId] = { x, y };
    localStorage.setItem(POI_POS_KEY, JSON.stringify(overrides));
  } catch(e) {}
}

// --- Hiển thị danh sách điểm tự đánh dấu ---
export function renderCustomPointsList() {
  const container = document.getElementById('custom-points-list');
  if (!container) return;

  if (state.customNodes.length === 0) {
    container.innerHTML = '<p class="hint">Chưa có điểm tự đánh dấu.</p>';
    const clearBtn = document.getElementById('clear-all-points-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    const exportBtn = document.getElementById('export-coords-btn');
    if (exportBtn) exportBtn.style.display = 'none';
    const textarea = document.getElementById('export-textarea');
    if (textarea) textarea.style.display = 'none';
    return;
  }

  let html = '';
  state.customNodes.forEach((node, idx) => {
    const color = node.floor === 1 ? '#ff6b35'
                : node.floor === 2 ? '#0066cc'
                : '#28a745';
    html += `
      <div class="custom-point-item">
        <span class="custom-point-index" style="--poi-color: ${color};">${idx + 1}</span>
        <span class="custom-point-name">
          ${node.label} <span class="muted">[T${displayFloor(node.floor)}]</span>
        </span>
        <button class="icon-button" onclick="App.deleteCustomNode('${node.id}')" title="Xoá">✕</button>
      </div>
    `;
  });
  container.innerHTML = html;

  const clearBtn = document.getElementById('clear-all-points-btn');
  if (clearBtn) clearBtn.style.display = 'block';

  const exportBtn = document.getElementById('export-coords-btn');
  if (exportBtn) exportBtn.style.display = 'block';
}

// --- Xuất tọa độ dạng JSON ---
export function exportCoords() {
  const points = state.customNodes.map((n, i) => ({
    id: `poi-${i + 1}`,
    label: n.label.replace('📍 ', ''),
    x: n.x,
    y: n.y,
    floor: n.floor,
  }));

  const code = JSON.stringify(points, null, 2);
  const textarea = document.getElementById('export-textarea');
  if (textarea) {
    textarea.value = code;
    textarea.style.display = 'block';
    textarea.select();
    try {
      navigator.clipboard.writeText(code);
      textarea.style.background = '#e8f5e9';
      setTimeout(() => { textarea.style.background = '#f5f1ec'; }, 2000);
    } catch(e) {}
  }
}
