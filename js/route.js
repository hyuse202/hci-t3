/**
 * route.js — Route display, route card, route info, find/clear route
 */

import { displayFloor, WALKING_SPEED, VOUCHER_THRESHOLD } from './config.js';
import { state } from './state.js';
import { getAllNodes, updateMarkersVisibility } from './markers.js';
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

    const mapArea = document.querySelector('.map-area');
    if (mapArea) {
      mapArea.classList.add('route-active');
    }
    updateMarkersVisibility();
  } else {
    state.currentPathLayer = null;
    const mapArea = document.querySelector('.map-area');
    if (mapArea) {
      mapArea.classList.remove('route-active');
    }
    updateMarkersVisibility();
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
  html += '<div class="route-steps-title"><i data-lucide="map-pin" style="width:14px;height:14px;vertical-align:-2px;"></i> Lộ trình theo chặng:</div>';
  html += '<div class="route-steps-list">';
  html += generateRouteStagesHtml(path, nodeMap);
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
  html += '<div class="steps-title"><i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:-1px;"></i> Hướng dẫn theo chặng</div>';
  html += generateRouteStagesHtml(path, nodeMap);
  html += '</div>';

  content.innerHTML = html;
  card.classList.add('visible');
  const toggleBtn = card.querySelector('.route-card-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (card.classList.contains('collapsed')) {
        card.classList.remove('collapsed');
        card.classList.remove('maximized');
        card.dataset.userCollapse = 'expanded';
      } else if (card.classList.contains('maximized')) {
        card.classList.remove('collapsed');
        card.classList.remove('maximized');
        card.dataset.userCollapse = 'expanded';
      } else {
        card.classList.add('collapsed');
        card.classList.remove('maximized');
        card.dataset.userCollapse = 'collapsed';
      }
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
  const maximized = card.classList.contains('maximized');
  toggleBtn.setAttribute('aria-expanded', String(!collapsed));
  const text = toggleBtn.querySelector('.toggle-text');
  if (text) {
    if (collapsed) {
      text.textContent = 'Mở';
    } else if (maximized) {
      text.textContent = 'Thu nhỏ';
    } else {
      text.textContent = 'Thu gọn';
    }
  }
}

// --- Tạo HTML hiển thị chặng đường ---
export function generateRouteStagesHtml(path, nodeMap) {
  const nodes = path.map(id => nodeMap[id]).filter(Boolean);
  if (nodes.length === 0) return '';

  const stages = [];
  let currentStage = null;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nextNode = nodes[i + 1];

    if (!currentStage) {
      currentStage = {
        type: 'floor_move',
        floor: node.floor,
        nodes: [node]
      };
    } else {
      currentStage.nodes.push(node);
    }

    if (nextNode) {
      if (nextNode.floor !== node.floor) {
        stages.push(currentStage);

        let connectorType = 'thang';
        const labelLower = node.label.toLowerCase();
        if (labelLower.includes('cuốn')) connectorType = 'thang cuốn';
        else if (labelLower.includes('máy')) connectorType = 'thang máy';
        else if (labelLower.includes('bộ')) connectorType = 'thang bộ';

        stages.push({
          type: 'floor_change',
          fromFloor: node.floor,
          toFloor: nextNode.floor,
          connector: node,
          connectorType: connectorType
        });

        currentStage = null;
      }
    }
  }
  if (currentStage) {
    stages.push(currentStage);
  }

  let html = '<div class="route-stages-timeline">';
  
  stages.forEach((stage, idx) => {
    const stageNum = idx + 1;
    if (stage.type === 'floor_move') {
      const isStart = idx === 0;
      const isEnd = idx === stages.length - 1;
      const first = stage.nodes[0];
      const last = stage.nodes[stage.nodes.length - 1];
      
      let title = `Chặng ${stageNum}: Đi trên Tầng ${displayFloor(stage.floor)}`;
      if (isStart && isEnd) {
        title = `Di chuyển tại Tầng ${displayFloor(stage.floor)}`;
      }

      let desc = '';
      if (stage.nodes.length === 1) {
        desc = `Tại <strong>${first.label}</strong>`;
      } else if (stage.nodes.length === 2) {
        desc = `Từ <strong>${first.label}</strong> tới <strong>${last.label}</strong>`;
      } else {
        // Lọc các địa điểm trung gian:
        // 1. Bỏ qua các tiện ích đi ngang qua (thang máy, thang cuốn, nhà vệ sinh, wc, vv) do người dùng chỉ đi ngang chứ không sử dụng
        // 2. Bỏ qua nếu trùng tên với điểm bắt đầu hoặc kết thúc của chặng
        const filteredMiddle = stage.nodes.slice(1, -1).filter(node => {
          const lbl = node.label.toLowerCase();
          const isUtility = lbl.includes('thang') || lbl.includes('vệ sinh') || lbl.includes('wc') || lbl.includes('lối đi') || lbl.includes('hành lang');
          const isStartOrEndLabel = (node.label === first.label || node.label === last.label);
          return !isUtility && !isStartOrEndLabel;
        });

        // 3. Loại bỏ trùng lặp liên tiếp (ví dụ: chuỗi băng chuyền hành lý dài)
        const uniqueMiddle = [];
        filteredMiddle.forEach(node => {
          if (uniqueMiddle.length === 0 || uniqueMiddle[uniqueMiddle.length - 1].label !== node.label) {
            uniqueMiddle.push(node);
          }
        });

        if (uniqueMiddle.length === 0) {
          desc = `Từ <strong>${first.label}</strong> tới <strong>${last.label}</strong>`;
        } else {
          const middleLabels = uniqueMiddle.map(n => n.label).join(' → ');
          desc = `Từ <strong>${first.label}</strong> qua <em>${middleLabels}</em> tới <strong>${last.label}</strong>`;
        }
      }

      html += `
        <div class="route-stage-item stage-move">
          <div class="stage-badge"><i data-lucide="map"></i></div>
          <div class="stage-content">
            <div class="stage-title">${title}</div>
            <div class="stage-desc">${desc}</div>
          </div>
        </div>
      `;
    } else if (stage.type === 'floor_change') {
      const direction = stage.toFloor > stage.fromFloor ? 'lên' : 'xuống';
      const iconName = stage.connectorType === 'thang cuốn' ? 'chevrons-up' 
                       : stage.connectorType === 'thang máy' ? 'arrow-up-down' 
                       : 'door-open';
      const desc = `Đi <strong>${stage.connectorType} (${stage.connector.label})</strong> để ${direction} Tầng ${displayFloor(stage.toFloor)}`;
      
      html += `
        <div class="route-stage-item stage-change">
          <div class="stage-badge"><i data-lucide="${iconName}"></i></div>
          <div class="stage-content">
            <div class="stage-title">Đổi tầng (${direction.toUpperCase()})</div>
            <div class="stage-desc">${desc}</div>
          </div>
        </div>
      `;
    }
  });

  html += '</div>';
  return html;
}
