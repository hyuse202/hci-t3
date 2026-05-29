# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Indoor navigation PWA for Terminal 3 (T3) of Tan Son Nhat International Airport — an HCI course prototype. The entire UI is in Vietnamese. Built with vanilla HTML/CSS/JS using **ES Modules** (`type="module"`), no frameworks, no build tools, no package.json.

**Detailed technical documentation is in `AGENTS.MD`** — read it before making changes.

## Running Locally

```bash
python3 -m http.server 5500    # → http://localhost:5500
```

No build step. No npm. Service Worker requires `http://localhost` or `https` to function.

Deployed via Netlify/Vercel (static hosting, zero config).

## Architecture

ES module SPA with `<script type="module">` entry point. 14 JS modules, 13 CSS files.

- **Module pattern**: Each file exports functions/constants. `app.js` is the thin entry point that imports everything and wires events.
- **State**: Centralized in `js/state.js` — a single mutable `state` object shared by all modules.
- **Map rendering**: Leaflet.js 1.9.4 via CDN with `CRS.Simple` (pixel coordinates, not geographic lat/lng)
- **Pathfinding**: A\* algorithm in `js/pathfinding.js`, Euclidean distance heuristic
- **Persistence**: `localStorage` keys `hci-t3-custom-nodes` and `hci-t3-poi-positions`
- **Data**: ~100 POI nodes in `js/data.js` `SAMPLE_POIS` array with graph edges (`links`)
- **Circular imports**: `markers ↔ selection ↔ route ↔ map` — safe because all cross-module calls happen at runtime (event handlers), not during module evaluation.

### Module Responsibilities

| Module | Lines | Role |
|---|---|---|
| `js/config.js` | 41 | Constants, CONFIG object, displayFloor() |
| `js/data.js` | 961 | SAMPLE_POIS array, CATEGORY_KEYWORDS (pure data) |
| `js/state.js` | 41 | Shared mutable state + event bus |
| `js/pathfinding.js` | 139 | buildGraph(), aStar() |
| `js/map.js` | 169 | Leaflet init, floor layers, switchFloor() |
| `js/markers.js` | 192 | POI markers, dropdowns, getAllNodes() |
| `js/selection.js` | 139 | Selection state, auto-route |
| `js/route.js` | 236 | Route display, voucher, route card |
| `js/gps.js` | 120 | GPS simulation mode |
| `js/custom-nodes.js` | 187 | Edit mode, localStorage, export |
| `js/search.js` | 165 | Search overlay, category chips |
| `js/ui.js` | 83 | Panel toggle, bottom sheet |
| `js/sw-register.js` | 16 | Service worker registration |
| `js/app.js` | 192 | **Entry point**: init(), event wiring, window.App |

### CSS Files

| File | Role |
|---|---|
| `css/tokens.css` | Design tokens (`:root`), reset, utilities — must load first |
| `css/layout.css` | Main layout container |
| `css/topbar.css` | Header bar, brand, actions |
| `css/panel.css` | Side panel, route form, backdrop |
| `css/buttons.css` | Button styles |
| `css/route-info.css` | Route details in panel |
| `css/voucher.css` | Voucher banner (gamification) |
| `css/edit-mode.css` | Edit mode, custom points, GPS status |
| `css/map.css` | Map area, Leaflet overrides |
| `css/markers.css` | POI markers, selection states, GPS dot, animations |
| `css/floor-tabs.css` | Floating floor switcher |
| `css/search.css` | Search trigger, overlay, category chips, results |
| `css/route-card.css` | Mobile route card (bottom sheet) |

Each CSS file contains its own responsive overrides (breakpoints: 1100px, 900px, 600px, 901px+).

## Critical Conventions

### Floor numbering (most common source of confusion)
Internal floor IDs `1/2/3` display as "Tầng 2/3/4". Function `displayFloor(f) = f + 1`.

### Leaflet coordinate system
Uses `CRS.Simple` — coordinates are **pixel positions on the image**, not latitude/longitude:
- `L.marker([y, x])` — **y (lat) comes first**, x (lng) second
- `e.latlng.lng` = pixel X, `e.latlng.lat` = pixel Y
- Image bounds: `[[0, 0], [imageHeight, imageWidth]]` (default 1920×1080)

### POI node structure
```js
{ id: 'poi-1', label: '🚻 WC', x: 340, y: 728, floor: 1, links: [{ to: 'poi-2', weight: 15 }] }
```
- `weight` is distance in meters. Graph is undirected (reverse links created automatically).
- Cross-floor links connect elevator/stairwell nodes between floors.
- ID ranges: Floor 1 → `poi-1` to `poi-53`, Floor 2 → `poi-101` to `poi-133`, Floor 3 → `poi-201` to `poi-218`.

### Config constants (`js/config.js`)
- `CONFIG.imageWidth/imageHeight`: map image pixel dimensions
- `WALKING_SPEED`: 80 meters/minute
- `VOUCHER_THRESHOLD`: route > 50 meters triggers voucher
- `PX_PER_M`: 10 (pixels per meter for A* heuristic)

## Adding New POIs

1. Add to `SAMPLE_POIS` array in `js/data.js` with unique `id` following the floor's ID range
2. Add `links` to neighboring nodes (same floor or cross-floor via elevators/stairs)
3. Estimate `weight` as walking distance in meters

## Adding New CSS Files

1. Create file in `css/`
2. Add `<link>` tag to `index.html` (after `tokens.css`)
3. Add path to `APP_SHELL` in `service-worker.js`
4. Bump `CACHE_NAME` in `service-worker.js`

## Public Debug API

Available in browser console via `App.*`: `switchFloor()`, `findRoute()`, `clearRoute()`, `clearSelection()`, `getAllNodes()`, `getCustomNodes()`, `getCurrentFloor()`, `getSelectedFrom()`, `getSelectedTo()`, `addCustomNode()`, `deleteCustomNode()`, `exportCoords()`, `refreshMarkers()`, `renderCustomPointsList()`.

## External Dependencies

Only **Leaflet.js 1.9.4** and **Google Fonts** (Instrument Serif, Hanken Grotesk) — loaded from CDN. No npm packages.
