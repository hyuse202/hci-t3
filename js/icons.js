/**
 * icons.js — Lucide icon utility
 *
 * Maps POI categories → Lucide icon names.
 * Provides renderIcons() to scan DOM for <i data-lucide="..."> and replace with SVGs.
 * Requires Lucide loaded via CDN: <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js">
 */

// Category → Lucide icon name (used by markers.js to pick icon from POI label)
export const CATEGORY_ICONS = {
  gate: 'door-open',
  lounge: 'armchair',
  wc: 'droplets',
  elevator: 'arrow-up-down',
  escalator: 'chevrons-up',
  food: 'coffee',
  baggage: 'luggage',
  smoke: 'cigarette-off',
  checkin: 'clipboard-check',
  stairs: 'door-open',
  custom: 'map-pin',
  other: 'map-pin',
};

// Floor icon mapping (used by search results)
export const FLOOR_ICONS = {
  1: 'shield-check',
  2: 'shopping-bag',
  3: 'plane-takeoff',
};

/**
 * Scan the DOM (or a subtree) and replace <i data-lucide="name"> with SVG icons.
 * Call after: DOM init, dynamic innerHTML updates, marker placement, floor switch.
 */
export function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
