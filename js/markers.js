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

export function getCategoryForLabel(label) {
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

// --- Helper: Tên rút gọn hiển thị dưới icon giống Google Maps ---
function getAnnotationLabel(node, category) {
  const shortLabel = node.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '').trim();
  if (category === 'wc') return 'WC';
  if (category === 'food') return 'Cafe';
  if (category === 'gate') return shortLabel;
  if (category === 'lounge') {
    if (shortLabel.toLowerCase().includes('lounge')) return shortLabel;
    return shortLabel.replace('Phòng khách', 'Lounge');
  }
  if (category === 'elevator') return 'Thang máy';
  if (category === 'escalator') return 'Thang cuốn';
  if (category === 'stairs') return 'Thang bộ';
  if (category === 'baggage') return 'Hành lý';
  if (category === 'smoke') return 'Hút thuốc';
  if (category === 'checkin') return 'Thủ tục';
  return shortLabel || node.label;
}

// --- Create Marker for a POI ---
export function createPOIMarker(node, map) {
  if (node.id === 'gps') return null;

  const isCustom = node.id.startsWith('custom-');

  const shortLabel = node.label.replace(/^[\p{Emoji}\p{Emoji_Component}]+\s*/u, '').trim();
  const category = isCustom ? 'custom' : getCategoryForLabel(shortLabel || node.label);
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const lucideName = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const displayLabel = getAnnotationLabel(node, category);

  const icon = L.divIcon({
    className: 'poi-marker',
    html: `
      <div class="poi-marker-wrapper" data-node-id="${node.id}">
        <div class="poi-pill${isCustom ? ' is-custom' : ''}" style="--poi-color: ${color};" data-node-id="${node.id}">
          <span class="pill-icon"><i data-lucide="${lucideName}"></i></span>
        </div>
        <div class="poi-label-tag">${displayLabel}</div>
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
  });

  // Áp dụng bộ lọc ẩn/hiện ban đầu
  updateMarkersVisibility();
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

// --- Helper: Tính khoảng cách từ điểm P đến đoạn thẳng AB ---
function getDistanceToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// --- Cập nhật hiển thị marker dựa trên zoom và định tuyến ---
export function updateMarkersVisibility() {
  if (!state.map) return;

  const currentZoom = state.map.getZoom();
  const isRouteActive = !!state.currentPath;
  const currentFloor = state.currentFloor;
  const allNodes = getAllNodes();

  // Tập hợp các ID thuộc lộ trình chính
  const pathNodeIds = new Set(state.currentPath || []);

  // Xác định các tiện ích nằm dọc lộ trình
  const utilitiesAlongPath = new Set();
  if (isRouteActive) {
    const floorPathNodes = (state.currentPath || [])
      .map(id => state.markerRefs[id]?.node)
      .filter(n => n && n.floor === currentFloor);

    const segments = [];
    for (let i = 0; i < floorPathNodes.length - 1; i++) {
      segments.push({ a: floorPathNodes[i], b: floorPathNodes[i + 1] });
    }

    allNodes.forEach(node => {
      if (node.floor !== currentFloor) return;
      if (pathNodeIds.has(node.id)) return;
      if (node.id === 'gps') return;

      const category = getCategoryForLabel(node.label);
      const isUtility = ['wc', 'food', 'elevator', 'escalator', 'smoke'].includes(category);
      if (!isUtility) return;

      let minDistance = Infinity;
      segments.forEach(seg => {
        const d = getDistanceToSegment(node, seg.a, seg.b);
        if (d < minDistance) minDistance = d;
      });

      if (minDistance <= 120) {
        utilitiesAlongPath.add(node.id);
      }
    });
  }

  // Áp dụng bộ lọc hiển thị
  allNodes.forEach(node => {
    const ref = state.markerRefs[node.id];
    if (!ref || !ref.marker) return;

    const marker = ref.marker;
    const isCustom = node.id.startsWith('custom-');
    const category = isCustom ? 'custom' : getCategoryForLabel(node.label);

    // 1. Chỉ hiển thị thuộc tầng hiện tại
    if (node.floor !== currentFloor) {
      if (state.map.hasLayer(marker)) {
        state.map.removeLayer(marker);
      }
      return;
    }

    // 2. Quy tắc hiển thị
    let shouldShow = false;

    if (isRouteActive) {
      const isInPath = pathNodeIds.has(node.id);
      const isUtilNear = utilitiesAlongPath.has(node.id);
      shouldShow = isInPath || isUtilNear;
    } else {
      const isProminent = ['gate', 'lounge', 'checkin', 'custom'].includes(category) || node.id === 'gps';
      if (currentZoom > 0) {
        shouldShow = true;
      } else {
        shouldShow = isProminent;
      }
    }

    // 3. Render lên bản đồ
    if (shouldShow) {
      if (!state.map.hasLayer(marker)) {
        marker.addTo(state.map);
      }

      const element = marker.getElement();
      if (element) {
        element.style.display = '';
        const pill = element.querySelector('.poi-pill');
        if (pill) {
          pill.classList.remove('expanded');
          if (isRouteActive) {
            const isInPath = pathNodeIds.has(node.id);
            if (isInPath) {
              pill.style.opacity = '1.0';
              pill.style.transform = 'scale(1.1)';
            } else {
              pill.style.opacity = '0.85';
              pill.style.transform = 'scale(0.85)';
            }
          } else {
            pill.style.opacity = '';
            pill.style.transform = '';
          }
        }
      }
    } else {
      if (state.map.hasLayer(marker)) {
        state.map.removeLayer(marker);
      }
    }
  });

  renderIcons();
}
