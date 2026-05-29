/**
 * route.js — Route display, route card, route info, find/clear route
 */

import { displayFloor, WALKING_SPEED, VOUCHER_THRESHOLD } from './config.js';
import { state } from './state.js';
import { getAllNodes } from './markers.js';
import { buildGraph, aStar } from './pathfinding.js';
import { autoOpenPanel } from './ui.js';

// --- Draw path on map ---
export function drawPath(path) {
  // Xoá path cũ
  if (state.currentPathLayer) {
    state.map.removeLayer(state.currentPathLayer);
    state.currentPathLayer = null;
  }

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
      color: '#ff6b35',
      weight: 5,
      opacity: 0.85,
      dashArray: '10, 6',
    }).addTo(state.map);

    state.map.fitBounds(state.currentPathLayer.getBounds().pad(0.2));
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
  let html = '<div class="stat"><span>Tổng quãng đường:</span><span><strong>';

  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph[path[i]]?.edges.find(e => e.to === path[i + 1]);
    if (edge) totalWeight += edge.weight;
  }

  const timeMin = Math.round(totalWeight / WALKING_SPEED);
  html += `${totalWeight} m</strong></span></div>`;
  html += `<div class="stat"><span>⏱️ Thời gian:</span><span><strong>~${timeMin} phút</strong></span></div>`;

  // Voucher nếu quãng đường > ngưỡng
  if (totalWeight > VOUCHER_THRESHOLD) {
    html += generateVoucherHtml();
  }

  html += '<hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;">';
  html += '<div style="font-weight: 600; margin-bottom: 6px;">📍 Các bước:</div>';

  path.forEach((id, idx) => {
    const node = nodeMap[id];
    if (!node) return;
    const prefix = idx === 0 ? '🟢 Xuất phát' : idx === path.length - 1 ? '🔴 Điểm đến' : `➡️ Bước ${idx}`;
    html += `<div class="step">${prefix}: <strong>${node.label}</strong> <span style="color:#888;font-size:11px;">[T${displayFloor(node.floor)}]</span></div>`;
  });

  document.getElementById('route-details').innerHTML = html;
  document.getElementById('route-info').classList.remove('hidden');
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
      '<p style="color: #d32f2f;">❌ Không tìm thấy đường đi giữa hai điểm này.</p>';
    document.getElementById('route-info').classList.remove('hidden');
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
      <div class="voucher-icon">🎉</div>
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

  if (!path || !graph) {
    content.innerHTML = `
      <div style="text-align:center; padding:16px; color:#d32f2f; font-weight:600;">
        ❌ Không tìm thấy đường đi
      </div>
    `;
    card.classList.add('visible');
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
        <div class="stat">🚶 ${totalWeight}m</div>
        <div class="stat">⏱️ ~${timeMin} phút</div>
      </div>
      <div class="route-card-actions">
        <button class="btn-card danger" onclick="App.clearSelection()">✕ Xoá</button>
      </div>
    </div>
  `;

  // Voucher
  if (totalWeight > VOUCHER_THRESHOLD) {
    html += generateVoucherHtml();
  }

  // Steps
  html += '<div class="route-card-steps">';
  html += '<div class="steps-title">📍 Hướng dẫn</div>';

  path.forEach((id, idx) => {
    const node = nodeMap[id];
    if (!node) return;

    let markerCls = '';
    let markerContent = '';
    if (idx === 0) {
      markerCls = 'start';
      markerContent = '🟢';
    } else if (idx === path.length - 1) {
      markerCls = 'end';
      markerContent = '🔴';
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
}

// --- Hide route card ---
export function hideRouteCard() {
  const card = document.getElementById('route-card');
  if (card) card.classList.remove('visible');
}
