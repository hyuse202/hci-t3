/**
 * state.js — Shared mutable state + simple event bus
 *
 * Tất cả state dùng chung giữa các module đều nằm ở đây.
 * Event bus dùng cho cross-module communication.
 */

// --- Shared mutable state ---
export const state = {
  map: null,
  currentFloor: 1,
  editMode: false,
  gpsMode: false,
  gpsNode: null,
  gpsMarker: null,
  customNodes: [],
  currentPath: null,
  currentPathLayer: null,
  currentPathArrowLayer: null,
  markerLayers: {},
  floorLayers: {},
  currentFloorLayer: null,
  selectedFrom: null,
  selectedTo: null,
  selectionMode: 'from', // 'from' | 'to'
  activeCategory: null,
  graph: {},
  markerRefs: {},
};

// --- Simple event bus ---
const listeners = {};

export function subscribe(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
}

export function emit(event, data) {
  if (!listeners[event]) return;
  listeners[event].forEach(cb => cb(data));
}
