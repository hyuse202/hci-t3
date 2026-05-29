/**
 * map.js — Leaflet map init, floor layers, floor switching
 */

import { CONFIG } from './config.js';
import { state } from './state.js';
import { drawPath } from './route.js';
import { renderIcons } from './icons.js';

// --- Map init ---
export function initMap() {
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3,
    zoomSnap: 0.5,
    zoomControl: true,
  });

  const cx = CONFIG.imageWidth / 2;
  const cy = CONFIG.imageHeight / 2;
  map.setView([cy, cx], 0);

  return map;
}

// --- Floor Layers ---
export function createFloorLayers(map) {
  const bounds = [[0, 0], [CONFIG.imageHeight, CONFIG.imageWidth]];

  for (let f = 1; f <= 3; f++) {
    const imgUrl = CONFIG.images[f];
    const overlay = L.imageOverlay(imgUrl, bounds, {
      opacity: 1,
      interactive: true,
    });
    state.floorLayers[f] = overlay;
  }

  state.currentFloorLayer = state.floorLayers[1];
  state.currentFloorLayer.addTo(map);
}

// --- Create Placeholder overlays (khi chưa có ảnh) ---
export function createPlaceholderLayers(map) {
  const bounds = [[0, 0], [CONFIG.imageHeight, CONFIG.imageWidth]];
  const colors = {
    1: { bg: '#fff0f3', border: '#ff385c', label: 'Tầng 2' },
    2: { bg: '#f0f0f0', border: '#222222', label: 'Tầng 3' },
    3: { bg: '#f5f5f5', border: '#6a6a6a', label: 'Tầng 4' },
  };

  for (let f = 1; f <= 3; f++) {
    const color = colors[f];

    const rect = L.rectangle(bounds, {
      color: color.border,
      weight: 2,
      fillColor: color.bg,
      fillOpacity: 0.3,
    });

    const centerLat = CONFIG.imageHeight / 2;
    const centerLng = CONFIG.imageWidth / 2;

    const icon = L.divIcon({
      className: 'placeholder-label',
      html: `
        <div style="
          background: rgba(255,255,255,0.9);
          padding: 16px 24px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
          border: 2px dashed ${color.border};
        ">
          <div style="font-size: 18px; font-weight: 700; color: ${color.border};">
            🗺️ ${color.label}
          </div>
          <div style="font-size: 13px; color: #666; margin-top: 6px;">
            Đặt ảnh tại <code>assets/floor-${f}.png</code>
          </div>
          <div style="font-size: 12px; color: #999; margin-top: 4px;">
            ${CONFIG.imageWidth} × ${CONFIG.imageHeight} px
          </div>
        </div>
      `,
      iconSize: [300, 120],
      iconAnchor: [150, 60],
    });

    const label = L.marker([centerLat, centerLng], { icon });
    state.floorLayers[f] = { rect, label };
  }

  state.currentFloorLayer = state.floorLayers[1];
  state.currentFloorLayer.rect.addTo(map);
  state.currentFloorLayer.label.addTo(map);
}

// --- Switch floor ---
export function switchFloor(floorNum) {
  if (floorNum === state.currentFloor) return;

  // Ẩn floor cũ
  const old = state.floorLayers[state.currentFloor];
  if (old.rect) {
    state.map.removeLayer(old.rect);
    state.map.removeLayer(old.label);
  } else {
    state.map.removeLayer(old);
  }

  // Ẩn markers của floor cũ
  if (state.markerLayers[state.currentFloor]) {
    state.markerLayers[state.currentFloor].forEach(m => state.map.removeLayer(m));
  }

  // Ẩn path nếu đang hiện
  if (state.currentPathLayer) {
    state.map.removeLayer(state.currentPathLayer);
    state.currentPathLayer = null;
  }

  // Hiện floor mới
  state.currentFloor = floorNum;
  const next = state.floorLayers[floorNum];
  if (next.rect) {
    next.rect.addTo(state.map);
    next.label.addTo(state.map);
  } else {
    next.addTo(state.map);
  }

  // Hiện markers của floor mới
  if (state.markerLayers[floorNum]) {
    state.markerLayers[floorNum].forEach(m => m.addTo(state.map));
  }

  if (state.gpsMarker && state.gpsNode) {
    if (state.gpsNode.floor === state.currentFloor) {
      state.gpsMarker.addTo(state.map);
    } else {
      state.map.removeLayer(state.gpsMarker);
    }
  }

  // Vẽ lại path nếu cần
  if (state.currentPath) {
    drawPath(state.currentPath);
  }

  // Cập nhật tabs
  document.querySelectorAll('.floor-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.floor) === floorNum);
  });

  // Render Lucide icons cho markers mới hiện
  renderIcons();
}

// --- Check if image files exist ---
export function checkImagesExist() {
  try {
    const url = CONFIG.images[1];
    const req = new XMLHttpRequest();
    req.open('HEAD', url, false);
    req.send();
    return req.status >= 200 && req.status < 400;
  } catch(e) {
    return false;
  }
}
