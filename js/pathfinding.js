/**
 * pathfinding.js — A* pathfinding + graph builder
 */

import { PX_PER_M } from './config.js';

// --- Build Graph từ POIs ---
export function buildGraph(pois) {
  const g = {};

  pois.forEach(node => {
    if (!g[node.id]) {
      g[node.id] = { id: node.id, label: node.label, x: node.x, y: node.y, floor: node.floor, edges: [] };
    }
    (node.links || []).forEach(link => {
      g[node.id].edges.push({ to: link.to, weight: link.weight });
      if (!g[link.to]) {
        const target = pois.find(p => p.id === link.to);
        if (target) {
          g[link.to] = { id: target.id, label: target.label, x: target.x, y: target.y, floor: target.floor, edges: [] };
        }
      }
    });
  });

  // Thêm reverse edges (undirected graph)
  pois.forEach(node => {
    (node.links || []).forEach(link => {
      if (g[link.to]) {
        const exists = g[link.to].edges.some(e => e.to === node.id);
        if (!exists) {
          g[link.to].edges.push({ to: node.id, weight: link.weight });
        }
      }
    });
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

  // Heuristic: Euclidean distance (pixel → mét)
  function heuristic(a, b) {
    const dx = graph[a].x - graph[b].x;
    const dy = graph[a].y - graph[b].y;
    return Math.sqrt(dx * dx + dy * dy) / PX_PER_M;
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
