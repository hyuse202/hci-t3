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

## Visual Language & Theme

**Mood**: Clean, minimal, Airbnb-inspired. Single accent color, soft rounded shapes, generous white space, map-first layout.

### Colors
- **Primary accent**: Rausch `#ff385c` — single brand color for all CTAs, search orb, selection states, brand mark
- **Rausch Active**: `#e00b41` (press state), **Rausch Disabled**: `#ffd1da`, **Rausch Soft**: `rgba(255, 56, 92, 0.10)`
- **Canvas**: `#ffffff` (pure white base — no dark mode)
- **Ink**: `#222222` (dominant text, never pure black)
- **Muted**: `#6a6a6a` (subtitles, inactive states)
- **Hairline**: `#dddddd` (borders), **Hairline Soft**: `#ebebeb`
- **Surface Soft**: `#f7f7f7`, **Surface Strong**: `#f2f2f2`

### Floor Marker Colors
| Internal Floor | Display | Color |
|---|---|---|
| 1 | Tầng 2 | `#ff385c` (Rausch) |
| 2 | Tầng 3 | `#222222` (Ink) |
| 3 | Tầng 4 | `#6a6a6a` (Muted) |

### Typography
- **Font**: Inter (400/500/600/700) via Google Fonts CDN
- Modest weights: headings at 600, body at 400–500. The layout trusts the map for visual weight.

### Iconography
- **System**: Lucide icons loaded via CDN (`lucide.min.js`)
- **Usage**: `<i data-lucide="icon-name"></i>` in HTML, then call `lucide.createIcons()` or `renderIcons()` from `js/icons.js`
- **Dynamic HTML**: After `innerHTML` updates, call `renderIcons()` to process new `<i data-lucide>` elements
- **POI markers**: Category-to-Lucide mapping in `js/icons.js` (`CATEGORY_ICONS` object)
- **Dropdown selects** (`<option>`): Keep plain text — HTML/SVG can't render inside `<option>` elements
- Stroke-based, 24×24 viewBox, `stroke="currentColor"` for CSS color inheritance
- ~25 icons used across the app

### Shape Language
- Border radius: 8px standard (`--radius-sm`/`--radius-md`), 14px for cards (`--radius-lg`), 9999px for pills/chips (`--radius-full`)
- Single shadow tier: `var(--shadow-card)` = `rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px`

### Touch Targets
- Minimum 48×48px for all interactive elements

## Architecture

ES module SPA with `<script type="module">` entry point. 15 JS modules, 13 CSS files.

- **Module pattern**: Each file exports functions/constants. `app.js` is the thin entry point that imports everything and wires events.
- **State**: Centralized in `js/state.js` — a single mutable `state` object shared by all modules.
- **Map rendering**: Leaflet.js 1.9.4 via CDN with `CRS.Simple` (pixel coordinates, not geographic lat/lng)
- **Pathfinding**: A\* algorithm in `js/pathfinding.js`, Euclidean distance heuristic
- **Icons**: Lucide via CDN + `js/icons.js` wrapper (CATEGORY_ICONS map, FLOOR_ICONS map, renderIcons helper)
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
| `js/markers.js` | 195 | POI markers, dropdowns, getAllNodes() |
| `js/selection.js` | 139 | Selection state, auto-route |
| `js/route.js` | 240 | Route display, voucher, route card |
| `js/gps.js` | 120 | GPS simulation mode |
| `js/custom-nodes.js` | 190 | Edit mode, localStorage, export |
| `js/search.js` | 170 | Search overlay, category chips |
| `js/ui.js` | 83 | Panel toggle, bottom sheet |
| `js/icons.js` | 40 | Lucide CATEGORY_ICONS map, FLOOR_ICONS, renderIcons() |
| `js/sw-register.js` | 16 | Service worker registration |
| `js/app.js` | 195 | **Entry point**: init(), event wiring, window.App |

### CSS Files

| File | Role |
|---|---|
| `css/tokens.css` | Design tokens (`:root`), reset, utilities, Lucide SVG global sizing — must load first |
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
{ id: 'poi-1', label: 'Nhà vệ sinh', x: 340, y: 728, floor: 1, links: [{ to: 'poi-2', weight: 15 }] }
```
- Labels are plain text — `markers.js` infers category from keywords and maps it to a Lucide icon via `CATEGORY_ICONS` in `js/icons.js`
- `weight` is distance in meters. Graph is undirected (reverse links created automatically).
- Cross-floor links connect elevator/stairwell nodes between floors.
- ID ranges: Floor 1 → `poi-1` to `poi-53`, Floor 2 → `poi-101` to `poi-133`, Floor 3 → `poi-201` to `poi-218`.

### Config constants (`js/config.js`)
- `CONFIG.imageWidth/imageHeight`: map image pixel dimensions
- `WALKING_SPEED`: 80 meters/minute
- `VOUCHER_THRESHOLD`: route > 50 meters triggers voucher
- `PX_PER_M`: 10 (pixels per meter for A* heuristic)

### Icon conventions
- **Static HTML** (`index.html`): Use `<i data-lucide="name"></i>`. Icons render on page load.
- **Dynamic HTML** (innerHTML in JS): Use `<i data-lucide="name"></i>` in the HTML string, then call `renderIcons()` after setting innerHTML.
- **L.divIcon markers**: Use `<i data-lucide="name"></i>` in the icon HTML. Call `renderIcons()` after `placeMarkers()`.
- **Select/Option elements**: Keep plain text — SVG icons cannot render inside `<option>` tags.

## Adding New POIs

1. Add to `SAMPLE_POIS` array in `js/data.js` with unique `id` following the floor's ID range
2. Add `links` to neighboring nodes (same floor or cross-floor via elevators/stairs)
3. Estimate `weight` as walking distance in meters
4. Ensure labels include a relevant keyword in `CATEGORY_KEYWORDS` so markers infer the right category. Add new icons in `CATEGORY_ICONS` when needed.

## Adding New CSS Files

1. Create file in `css/`
2. Add `<link>` tag to `index.html` (after `tokens.css`)
3. Add path to `APP_SHELL` in `service-worker.js`
4. Bump `CACHE_NAME` in `service-worker.js`

## Public Debug API

Available in browser console via `App.*`: `switchFloor()`, `findRoute()`, `clearRoute()`, `clearSelection()`, `getAllNodes()`, `getCustomNodes()`, `getCurrentFloor()`, `getSelectedFrom()`, `getSelectedTo()`, `addCustomNode()`, `deleteCustomNode()`, `exportCoords()`, `refreshMarkers()`, `renderCustomPointsList()`.

## External Dependencies

| Library | Version | Purpose |
|---|---|---|
| Leaflet.js | 1.9.4 | Flat image map, markers, polyline |
| Google Fonts | — | Inter (400/500/600/700) |
| Lucide Icons | latest | SVG icon library (vanilla JS, CDN) |

All loaded from CDN. No npm packages. No build step.
