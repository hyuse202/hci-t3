/**
 * route.js — Route display, route card, route info, find/clear route
 */

import { displayFloor, WALKING_SPEED, VOUCHER_THRESHOLD } from './config.js';
import { state } from './state.js';
import { getAllNodes } from './markers.js';
import { buildGraph, aStar } from './pathfinding.js';
import { autoOpenPanel } from './ui.js';
import { renderIcons } from './icons.js';

export function clearRouteArrows() {
  if (state.currentPathArrowLayer) {
    state.map.removeLayer(state.currentPathArrowLayer);
    state.currentPathArrowLayer = null;
  }
}

// --- Draw path on map ---
export function drawPath(path) {
  // Xoá path cũ
  if (state.currentPathLayer) {
    state.map.removeLayer(state.currentPathLayer);
    state.currentPathLayer = null;
  }
  clearRouteArrows();

  const allNodes = getAllNodes();
  const nodeMap = {};
  allNodes.forEach(n => { nodeMap[n.id] = n; });

  // Lọc các node thuộc floor hiện tại để vẽ
  const segments = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = nodeMap[path[i]];
    const b = nodeMap[path[i + 1]];
    if (!a || !b) continue;

    segments.push({
      a: { x: a.x, y: a.y, floor: a.floor },
      b: { x: b.x, y: b.y, floor: b.floor },
      labelA: a.label,
      labelB: b.label,
    });
  }

  // Vẽ từng segment — chỉ vẽ segment thuộc floor hiện tại
  const latlngs = [];
  for (const seg of segments) {
    if (seg.a.floor === state.currentFloor && seg.b.floor === state.currentFloor) {
      latlngs.push([seg.a.y, seg.a.x]);
      latlngs.push([seg.b.y, seg.b.x]);
    }
  }

  if (latlngs.length > 0) {
    state.currentPathLayer = L.polyline(latlngs, {
      color: '#ff385c',
      weight: 5,
      opacity: 0.85,
      dashArray: '10, 6',
      className: 'route-path',
    }).addTo(state.map);

    const arrowMarkers = [];
    for (const seg of segments) {
      if (seg.a.floor !== state.currentFloor || seg.b.floor !== state.currentFloor) continue;
      const aPoint = state.map.latLngToLayerPoint([seg.a.y, seg.a.x]);
      const bPoint = state.map.latLngToLayerPoint([seg.b.y, seg.b.x]);
      const dx = bPoint.x - aPoint.x;
      const dy = bPoint.y - aPoint.y;
      const length = Math.hypot(dx, dy);
      if (length < 28) continue;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const midX = (seg.a.x + seg.b.x) / 2;
      const midY = (seg.a.y + seg.b.y) / 2;
      const icon = L.divIcon({
        className: 'route-arrow-icon',
        html: `<div class="route-arrow" style="--arrow-angle:${angle}deg;"><i data-lucide="arrow-right"></i></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([midY, midX], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 200,
      });
      arrowMarkers.push(marker);
    }
    if (arrowMarkers.length > 0) {
      state.currentPathArrowLayer = L.layerGroup(arrowMarkers).addTo(state.map);
      renderIcons();
    }

    // Focus on start position, then fit full route
    state.map.fitBounds(state.currentPathLayer.getBounds().pad(0.2));
    const startNode = nodeMap[path[0]];
    if (startNode) {
      setTimeout(() => state.map.panTo([startNode.y, startNode.x], { animate: true, duration: 0.5 }), 300);
    }
  } else {
    state.currentPathLayer = null;
  }
}

// --- Show route info (panel) ---
export function showRouteInfo(path, graph) {
  const allNodes = getAllNodes();
  const nodeMap = {};
  allNodes.forEach(n => { nodeMap[n.id] = n; });

  let totalWeight = 0;
  let html = '<div class="route-summary">';
  html += '<div class="stat"><span>Tổng quãng đường:</span><span><strong>';

  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph[path[i]]?.edges.find(e => e.to === path[i + 1]);
    if (edge) totalWeight += edge.weight;
  }

  const timeMin = Math.round(totalWeight / WALKING_SPEED);
  html += `${totalWeight} m</strong></span></div>`;
  html += `<div class="stat"><span><i data-lucide="clock" style="width:14px;height:14px;vertical-align:-2px;"></i> Thời gian:</span><span><strong>~${timeMin} phút</strong></span></div>`;
  html += '</div>';
  html += '<div class="route-detail-body">';

  // Voucher nếu quãng đường > ngưỡng
  if (totalWeight > VOUCHER_THRESHOLD) {
    html += generateVoucherHtml();
  }

  html += '<hr style="border: none; border-top: 1px dashed #dddddd; margin: 8px 0;">';
  html += '<div class="route-steps-title"><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:-2px;"></i> Các bước:</div>';
  html += '<div class="route-steps-list">';

  path.forEach((id, idx) => {
    const node = nodeMap[id];
    if (!node) return;
    const prefix = idx === 0 ? '<i data-lucide="play" style="width:12px;height:12px;color:#222;vertical-align:-1px;"></i> Xuất phát'
                   : idx === path.length - 1 ? '<i data-lucide="flag" style="width:12px;height:12px;color:#ff385c;vertical-align:-1px;"></i> Điểm đến'
                   : `<i data-lucide="corner-down-right" style="width:12px;height:12px;color:#6a6a6a;vertical-align:-1px;"></i> Bước ${idx}`;
    html += `<div class="step">${prefix}: <strong>${node.label}</strong> <span style="color:#6a6a6a;font-size:11px;">[T${displayFloor(node.floor)}]</span></div>`;
  });
  html += '</div>';
  html += '</div>';

  document.getElementById('route-details').innerHTML = html;
  document.getElementById('route-info').classList.remove('hidden');
  renderIcons();
}

// --- Find and draw route ---
export function findRoute() {
  const fromId = document.getElementById('from-select').value;
  const toId = document.getElementById('to-select').value;

  if (!fromId || !toId) {
    alert('Vui lòng chọn cả điểm đi và điểm đến!');
    return;
  }

  if (fromId === toId) {
    alert('Điểm đi và đến phải khác nhau!');
    return;
  }

  const allNodes = getAllNodes();
  const g = buildGraph(allNodes);

  const path = aStar(g, fromId, toId);

  if (!path) {
    document.getElementById('route-details').innerHTML =
      '<p style="color: #c13515;"><i data-lucide="circle-x" style="width:14px;height:14px;vertical-align:-2px;"></i> Không tìm thấy đường đi giữa hai điểm này.</p>';
    document.getElementById('route-info').classList.remove('hidden');
    renderIcons();
    autoOpenPanel();
    return;
  }

  state.currentPath = path;
  drawPath(path);

  showRouteInfo(path, g);
  autoOpenPanel();
}

// --- Generate voucher HTML ---
function generateVoucherHtml() {
  const maxDiscounts = [20000, 30000, 50000, 70000, 100000];
  const maxDiscount = maxDiscounts[Math.floor(Math.random() * maxDiscounts.length)];
  const code = 'VCH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  return `
    <div class="voucher-banner">
      <div class="voucher-icon"><i data-lucide="party-popper"></i></div>
      <div class="voucher-body">
        <div class="voucher-title">Bạn nhận được Voucher!</div>
        <div class="voucher-desc">Giảm 25% tại quán cà phê giải khát (tối đa ${maxDiscount.toLocaleString('vi-VN')}đ)</div>
        <div class="voucher-code">Mã: <strong>${code}</strong></div>
        <div class="voucher-footnote">*Chỉ áp dụng 1 lần, có hiệu lực trong 24h</div>
      </div>
    </div>`;
}

// --- Show route card (mobile) ---
export function showRouteCard(path, graph) {
  const card = document.getElementById('route-card');
  const content = document.getElementById('route-card-content');
  if (!card || !content) return;

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  if (card.dataset.userCollapse === 'collapsed') {
    card.classList.add('collapsed');
  } else if (card.dataset.userCollapse === 'expanded') {
    card.classList.remove('collapsed');
  } else if (isMobile) {
    card.classList.add('collapsed');
  } else {
    card.classList.remove('collapsed');
  }

  if (!path || !graph) {
    content.innerHTML = `
      <div style="text-align:center; padding:16px; color:#c13515; font-weight:600;">
        <i data-lucide="circle-x" style="width:16px;height:16px;vertical-align:-2px;"></i> Không tìm thấy đường đi
      </div>
    `;
    card.classList.add('visible');
    renderIcons();
    return;
  }

  const allNodes = getAllNodes();
  const nodeMap = {};
  allNodes.forEach(n => { nodeMap[n.id] = n; });

  let totalWeight = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph[path[i]]?.edges.find(e => e.to === path[i + 1]);
    if (edge) totalWeight += edge.weight;
  }

  const timeMin = Math.max(1, Math.round(totalWeight / WALKING_SPEED));

  let html = `
    <div class="route-card-header">
      <div class="route-card-stats">
        <div class="stat"><i data-lucide="footprints" style="width:16px;height:16px;"></i> ${totalWeight}m</div>
        <div class="stat"><i data-lucide="clock" style="width:16px;height:16px;"></i> ~${timeMin} phút</div>
      </div>
      <div class="route-card-actions">
        <button class="btn-card route-card-toggle" type="button" aria-expanded="true">
          <i data-lucide="chevrons-down" class="toggle-icon" style="width:12px;height:12px;"></i>
          <span class="toggle-text">Thu gọn</span>
        </button>
        <button class="btn-card danger" onclick="App.clearSelection()"><i data-lucide="x" style="width:12px;height:12px;"></i> Xoá</button>
      </div>
    </div>
  `;

  // Voucher
  if (totalWeight > VOUCHER_THRESHOLD) {
    html += generateVoucherHtml();
  }

  // Steps
  html += '<div class="route-card-steps">';
  html += '<div class="steps-title"><i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:-1px;"></i> Hướng dẫn</div>';

  path.forEach((id, idx) => {
    const node = nodeMap[id];
    if (!node) return;

    let markerCls = '';
    let markerContent = '';
    if (idx === 0) {
      markerCls = 'start';
      markerContent = '<i data-lucide="play" style="width:12px;height:12px;"></i>';
    } else if (idx === path.length - 1) {
      markerCls = 'end';
      markerContent = '<i data-lucide="flag" style="width:12px;height:12px;"></i>';
    } else {
      markerContent = idx;
    }

    html += `
      <div class="route-step">
        <div class="step-marker ${markerCls}">${markerContent}</div>
        <div class="step-info">
          <div class="step-label">${node.label}</div>
          <div class="step-floor">Tầng ${displayFloor(node.floor)}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';

  content.innerHTML = html;
  card.classList.add('visible');
  const toggleBtn = card.querySelector('.route-card-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const collapsed = !card.classList.contains('collapsed');
      card.classList.toggle('collapsed', collapsed);
      card.dataset.userCollapse = collapsed ? 'collapsed' : 'expanded';
      syncRouteCardToggle(card);
    });
  }
  syncRouteCardToggle(card);
  renderIcons();
}

// --- Hide route card ---
export function hideRouteCard() {
  const card = document.getElementById('route-card');
  if (card) card.classList.remove('visible');
}

export function syncRouteCardToggle(card) {
  if (!card) return;
  const toggleBtn = card.querySelector('.route-card-toggle');
  if (!toggleBtn) return;
  const collapsed = card.classList.contains('collapsed');
  toggleBtn.setAttribute('aria-expanded', String(!collapsed));
  const text = toggleBtn.querySelector('.toggle-text');
  if (text) text.textContent = collapsed ? 'Mở' : 'Thu gọn';
}
