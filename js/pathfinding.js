/**
 * pathfinding.js — A* pathfinding + graph builder
 */

import { PX_PER_M } from './config.js';

// --- Build Graph từ POIs ---
export function buildGraph(pois) {
  const g = {};

  // Khởi tạo các node
  pois.forEach(node => {
    if (!g[node.id]) {
      g[node.id] = { id: node.id, label: node.label, x: node.x, y: node.y, floor: node.floor, edges: [] };
    }
    
    (node.links || []).forEach(link => {
      const target = pois.find(p => p.id === link.to);
      let weight = link.weight;
      
      // Phân loại trọng số:
      if (target && target.floor !== node.floor) {
        // 1. Khác tầng: Phạt trọng số tối thiểu 80 mét để tránh thuật toán lạm dụng đổi tầng
        weight = Math.max(80, link.weight);
      } else if (target) {
        // 2. Cùng tầng: TỰ ĐỘNG HIỆU CHUẨN trọng số dựa trên tọa độ pixel thực tế trên ảnh sơ đồ
        // Giúp loại bỏ lỗi dữ liệu nhập bằng tay sai lệch khoảng cách
        const dx = node.x - target.x;
        const dy = node.y - target.y;
        const pixelDist = Math.sqrt(dx * dx + dy * dy);
        weight = Math.max(1, Math.round(pixelDist / PX_PER_M));
      }
      
      g[node.id].edges.push({ to: link.to, weight });
      
      if (!g[link.to] && target) {
        g[link.to] = { id: target.id, label: target.label, x: target.x, y: target.y, floor: target.floor, edges: [] };
      }
    });
  });

  // Thêm reverse edges (undirected graph)
  pois.forEach(node => {
    (node.links || []).forEach(link => {
      if (g[link.to]) {
        const exists = g[link.to].edges.some(e => e.to === node.id);
        if (!exists) {
          const target = pois.find(p => p.id === link.to);
          let weight = link.weight;
          if (target && target.floor !== node.floor) {
            weight = Math.max(80, link.weight);
          } else if (target) {
            const dx = node.x - target.x;
            const dy = node.y - target.y;
            const pixelDist = Math.sqrt(dx * dx + dy * dy);
            weight = Math.max(1, Math.round(pixelDist / PX_PER_M));
          }
          g[link.to].edges.push({ to: node.id, weight });
        }
      }
    });
  });

  // Tự động tiêm (inject) các kết nối bị thiếu trên cùng một tầng để liên kết các khu vực biệt lập
  const missingConnections = [
    // --- TẦNG 2 (Internal Floor 1) ---
    { from: 'poi-42', to: 'poi-45', weight: 18 },  // Nối hành lang trái-phải ở khu thang máy
    { from: 'poi-50', to: 'poi-10', weight: 24 },  // Nối nhà vệ sinh với khu phòng hút thuốc góc phải
    { from: 'poi-32', to: 'poi-41', weight: 11 },  // Nối khu băng chuyền hành lý xuống thang cuốn
    { from: 'poi-38', to: 'poi-42', weight: 13 },  // Nối băng chuyền hành lý xuống thang cuốn giữa
    { from: 'poi-12', to: 'poi-43', weight: 21 },  // Nối khu cafe với thang cuốn bên phải
    { from: 'poi-14', to: 'poi-32', weight: 9 },   // Nối hành lang Gate A2 trực tiếp xuống băng chuyền
    { from: 'poi-9', to: 'poi-5', weight: 27 },    // Nối thang cuốn giữa và thang cuốn trái tạo hành lang ngang thẳng
    
    // --- TẦNG 3 (Internal Floor 2) ---
    { from: 'poi-131', to: 'poi-121', weight: 25 }, // Nối cụm thang bên trái vào sảnh làm thủ tục chính
    { from: 'poi-133', to: 'poi-125', weight: 34 }  // Nối cụm thang bên phải vào sảnh làm thủ tục chính
  ];

  missingConnections.forEach(c => {
    if (g[c.from] && g[c.to]) {
      if (!g[c.from].edges.some(e => e.to === c.to)) {
        g[c.from].edges.push({ to: c.to, weight: c.weight });
      }
      if (!g[c.to].edges.some(e => e.to === c.from)) {
        g[c.to].edges.push({ to: c.from, weight: c.weight });
      }
    }
  });

  // Tự nối custom/gps node với node gần nhất cùng tầng
  const baseNodes = pois.filter(p => !p.id.startsWith('custom-') && p.id !== 'gps');
  const ensureCustomConnected = (node) => {
    const current = g[node.id];
    if (!current) return;

    const hasBaseEdge = current.edges.some(e => {
      const target = g[e.to];
      return target && !target.id.startsWith('custom-') && target.id !== 'gps';
    });
    if (hasBaseEdge) return;

    const candidates = baseNodes.filter(p => p.floor === node.floor);
    if (candidates.length === 0) return;

    let nearest = null;
    let best = Infinity;
    candidates.forEach(p => {
      const dx = node.x - p.x;
      const dy = node.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < best) {
        best = dist;
        nearest = p;
      }
    });

    if (nearest) {
      const weight = Math.max(1, Math.round(best / PX_PER_M));
      current.edges.push({ to: nearest.id, weight });
      if (g[nearest.id] && !g[nearest.id].edges.some(e => e.to === node.id)) {
        g[nearest.id].edges.push({ to: node.id, weight });
      }
    }
  };

  pois.forEach(node => {
    if (node.id.startsWith('custom-') || node.id === 'gps') {
      ensureCustomConnected(node);
    }
  });

  return g;
}

// --- A* Pathfinding ---
export function aStar(graph, startId, endId) {
  const openSet = new Set([startId]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  Object.keys(graph).forEach(id => {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  });
  gScore[startId] = 0;

  // Heuristic: Euclidean distance + Floor penalty
  function heuristic(a, b) {
    const dx = graph[a].x - graph[b].x;
    const dy = graph[a].y - graph[b].y;
    const dist2D = Math.sqrt(dx * dx + dy * dy) / PX_PER_M;
    
    // Phạt đổi tầng: Thêm 100 mét giả lập cho mỗi tầng chênh lệch
    const floorDiff = Math.abs(graph[a].floor - graph[b].floor);
    const floorPenalty = floorDiff * 100; 
    
    return dist2D + floorPenalty;
  }

  fScore[startId] = heuristic(startId, endId);

  while (openSet.size > 0) {
    let current = null;
    let currentF = Infinity;
    openSet.forEach(id => {
      if (fScore[id] < currentF) {
        currentF = fScore[id];
        current = id;
      }
    });

    if (current === endId) {
      const path = [];
      let node = endId;
      while (node) {
        path.unshift(node);
        node = cameFrom[node];
      }
      return path;
    }

    openSet.delete(current);
    const neighbors = graph[current]?.edges || [];
    for (const neighbor of neighbors) {
      const tentativeG = gScore[current] + neighbor.weight;
      if (tentativeG < gScore[neighbor.to]) {
        cameFrom[neighbor.to] = current;
        gScore[neighbor.to] = tentativeG;
        fScore[neighbor.to] = tentativeG + heuristic(neighbor.to, endId);
        openSet.add(neighbor.to);
      }
    }
  }

  return null; // Không tìm thấy đường
}
