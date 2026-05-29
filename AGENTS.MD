# AGENT.MD — Ngữ cảnh dự án: Định tuyến nhà ga T3

> File này mô tả toàn bộ kiến trúc, logic và quy ước của project cho AI agent.
> Đọc kỹ trước khi thay đổi bất kỳ file nào.

---

## 1. Tổng quan dự án

**Tên:** Định tuyến trong nhà — Ga T3 Tân Sơn Nhất
**Loại:** HCI Prototype — Progressive Web App (PWA)
**Mục đích:** Cho phép hành khách tìm đường đi bộ trong nhà ga T3, sân bay Quốc tế Tân Sơn Nhất (TP.HCM).
**Ngôn ngữ:** Vietnamese (UI), JavaScript (code comments cũng dùng tiếng Việt).
**Stack:** Vanilla HTML + CSS + JavaScript, dùng **ES Modules** (`type="module"`), không dùng framework JS.

### Triển khai
- **Netlify** (`netlify.toml`) và **Vercel** (`vercel.json`) đã được cấu hình.
- Chạy local: `python3 -m http.server 5500` → `http://localhost:5500`

---

## 2. Cấu trúc thư mục

```
hci-t3/
├── index.html                # Trang duy nhất (SPA), load ES module
├── css/
│   ├── tokens.css            # Design tokens (:root), reset, utilities
│   ├── layout.css            # .layout container
│   ├── topbar.css            # .topbar, .brand, .topbar-actions + responsive
│   ├── panel.css             # .side-panel, .panel-*, .route-form, backdrop + responsive
│   ├── buttons.css           # .btn-*, .icon-button
│   ├── route-info.css        # .route-info, #route-details, .stat, .step
│   ├── voucher.css           # .voucher-* banner
│   ├── edit-mode.css         # .toggle-*, .hint, .gps-status, .custom-point-*
│   ├── map.css               # .map-area, #map, .floor-btn, Leaflet overrides + responsive
│   ├── markers.css           # .poi-marker, .poi-pill, .gps-dot, selection states, animations + responsive
│   ├── floor-tabs.css        # .floor-tabs-bottom + responsive
│   ├── search.css            # .mobile-search-*, .category-chip*, .search-result-* + responsive
│   └── route-card.css        # .route-card, .route-step, .drag-handle + responsive
├── js/
│   ├── config.js             # CONFIG, STORAGE_KEY, POI_POS_KEY, PX_PER_M, displayFloor()
│   ├── data.js               # SAMPLE_POIS (104 nodes), CATEGORY_KEYWORDS
│   ├── state.js              # Shared mutable state object + event bus (subscribe/emit)
│   ├── pathfinding.js        # buildGraph(), aStar() — A* pathfinding
│   ├── map.js                # initMap(), createFloorLayers(), switchFloor(), checkImagesExist()
│   ├── markers.js            # createPOIMarker(), placeMarkers(), refreshMarkers(), populateDropdowns(), getAllNodes()
│   ├── selection.js          # selectPOI(), highlightMarker(), clearSelection(), autoFindRoute(), handleMobileTap()
│   ├── route.js              # drawPath(), showRouteInfo(), showRouteCard(), findRoute(), hideRouteCard()
│   ├── gps.js                # setGpsMode(), setGpsLocation(), createGpsMarker()
│   ├── custom-nodes.js       # addCustomNode(), deleteCustomNode(), saveCustomNodes(), loadCustomNodes(), loadPoiPositions(), savePoiPosition(), exportCoords(), renderCustomPointsList()
│   ├── search.js             # searchPOIs(), showSearchResults(), openSearchOverlay(), closeSearchOverlay(), setupSearchEvents()
│   ├── ui.js                 # setupPanelToggle(), autoOpenPanel()
│   ├── sw-register.js        # registerServiceWorker()
│   └── app.js                # Entry point: init(), event wiring, window.App public API
├── assets/
│   ├── floor-1.png           # Sơ đồ Tầng 2 (hành khách đến)
│   ├── floor-2.png           # Sơ đồ Tầng 3 (thương mại)
│   ├── floor-3.png           # Sơ đồ Tầng 4 (khởi hành)
│   └── icons/                # PWA icons (192px, 512px, apple-touch)
├── manifest.json             # PWA manifest
├── service-worker.js         # Service Worker (cache-first shell, network-first map images)
├── netlify.toml
├── vercel.json
├── CLAUDE.md                 # Guidance for Claude Code
└── AGENTS.MD                 # This file
```

---

## 3. Kiến trúc JS — ES Modules

### 3.1 Entry point (`js/app.js`)

File `app.js` là entry point duy nhất, load qua `<script type="module">`. Nó:
- Import tất cả modules
- Khởi tạo app trong hàm `init()` (gọi khi `DOMContentLoaded`)
- Expose public API qua `window.App`

### 3.2 Module dependencies

```
app.js (entry point)
├── config.js          (zero deps)
├── data.js            (zero deps)
├── state.js           (zero deps)
├── pathfinding.js     ← config.js
├── map.js             ← config.js, state.js, route.js
├── markers.js         ← config.js, state.js, data.js, selection.js, custom-nodes.js, map.js
├── selection.js       ← state.js, markers.js, pathfinding.js, route.js, map.js
├── route.js           ← config.js, state.js, markers.js, pathfinding.js, ui.js
├── gps.js             ← config.js, state.js, markers.js, selection.js, route.js
├── custom-nodes.js    ← config.js, state.js, data.js, markers.js, selection.js, gps.js
├── search.js          ← config.js, state.js, data.js, markers.js, map.js, selection.js
├── ui.js              (zero deps)
└── sw-register.js     (zero deps)
```

**Circular imports**: `markers ↔ selection ↔ route ↔ map`. ES modules xử lý đúng vì tất cả function calls xảy ra ở runtime (event handlers), không phải lúc module evaluation.

### 3.3 State module (`js/state.js`)

Tất cả shared mutable state nằm trong một object duy nhất:

```js
export const state = {
  map, currentFloor, editMode, gpsMode, gpsNode, gpsMarker,
  customNodes, currentPath, currentPathLayer, markerLayers, floorLayers,
  currentFloorLayer, selectedFrom, selectedTo, selectionMode,
  activeCategory, graph, markerRefs,
};
```

Event bus đơn giản: `subscribe(event, cb)` / `emit(event, data)`.

### 3.4 Config (`js/config.js`)

```js
export const CONFIG = {
  imageWidth: 1920, imageHeight: 1080,
  images: { 1: 'assets/floor-1.png', 2: 'assets/floor-2.png', 3: 'assets/floor-3.png' },
  floorNames: { 1: 'Tầng 2 — Hành khách đến', ... },
};
export const STORAGE_KEY = 'hci-t3-custom-nodes';
export const POI_POS_KEY = 'hci-t3-poi-positions';
export const PX_PER_M = 10;        // pixels per meter cho A* heuristic
export const WALKING_SPEED = 80;    // mét/phút
export const VOUCHER_THRESHOLD = 50; // mét
export function displayFloor(f) { return f + 1; }
```

> **Quy ước tầng:** Internal floor `1/2/3` ↔ hiển thị `Tầng 2/3/4`.

### 3.5 Data (`js/data.js`)

Mảng `SAMPLE_POIS` (~961 dòng, 104 nodes). Cấu trúc mỗi node:

```js
{
  id: 'poi-1', label: '🚻 Tên', x: 540, y: 663, floor: 1,
  links: [{ to: 'poi-2', weight: 15 }],  // weight = mét
}
```

**Phân bổ node theo tầng:**
| Internal | Hiển thị | ID range | Nội dung |
|---|---|---|---|
| `floor: 1` | Tầng 2 | `poi-1` → `poi-53` | Hành khách đến, băng chuyền, thang, WC |
| `floor: 2` | Tầng 3 | `poi-101` → `poi-133` | Gates, thủ tục, thang cuốn, WC |
| `floor: 3` | Tầng 4 | `poi-201` → `poi-218` | Phòng khách VIP, thang máy/bộ |

`CATEGORY_KEYWORDS` map dùng cho tìm kiếm theo danh mục.

### 3.6 Public API (`window.App`)

```js
window.App = {
  switchFloor, findRoute, clearRoute, clearSelection,
  addCustomNode, deleteCustomNode, exportCoords,
  refreshMarkers, renderCustomPointsList,
  getCurrentFloor: () => state.currentFloor,
  getCustomNodes: () => state.customNodes,
  getAllNodes,
  getSelectedFrom: () => state.selectedFrom,
  getSelectedTo: () => state.selectedTo,
};
```

Dùng được trong Console (F12) để debug.

---

## 4. Leaflet — Hệ tọa độ

Project dùng `L.CRS.Simple` — tọa độ **không phải lat/lng địa lý**.

```
Leaflet [lat, lng]  ↔  Pixel [y, x]
```

- `lat` = pixel Y (từ trên xuống, `0` = mép trên ảnh)
- `lng` = pixel X (từ trái sang, `0` = mép trái ảnh)
- Bounds = `[[0, 0], [imageHeight, imageWidth]]`
- Map `setView([cy, cx], 0)` — khởi tạo ở giữa ảnh, zoom 0

**Khi tạo marker:** `L.marker([node.y, node.x], ...)` — y trước, x sau.

---

## 5. CSS — Design System

### Design tokens (`css/tokens.css`, `:root`)

```css
--font-display: "Instrument Serif", serif;
--font-body: "Hanken Grotesk", sans-serif;
--paper: #ffffff; --panel: #ffffff; --ink: #1f1a16; --muted: #6f675f;
--line: rgba(31, 26, 22, 0.12);
--accent: #ff6b35; --accent-strong: #e15423; --accent-soft: rgba(255, 107, 53, 0.18);
--topbar-h: 66px; --panel-w: 360px; --sheet-peek: 74px;
```

### Màu marker theo tầng

| Floor (internal) | Màu |
|---|---|
| 1 (Tầng 2) | `#ff6b35` (cam) |
| 2 (Tầng 3) | `#0066cc` (xanh dương) |
| 3 (Tầng 4) | `#28a745` (xanh lá) |

### Responsive breakpoints

| Breakpoint | Thay đổi chính |
|---|---|
| `≤ 1100px` | `--panel-w: 320px` |
| `≤ 900px` | Panel ẩn, topbar compact, mobile search hiện, POI markers larger |
| `≤ 600px` | Search/card sizing nhỏ hơn, safe-area-inset |
| `≥ 901px` | Panel ẩn, topbar compact, search/gps hiện, hover states |

Mỗi CSS file chứa responsive overrides cho component đó (không gom cuối file).

### CSS load order (trong `index.html`)

`tokens.css` phải load trước (chứa `:root` variables). Các file khác không phụ thuộc thứ tự.

---

## 6. HTML — `index.html`

```html
<script type="module" src="js/app.js"></script>
```

13 `<link>` CSS tags theo thứ tự: tokens → layout → topbar → panel → buttons → route-info → voucher → edit-mode → map → markers → floor-tabs → search → route-card.

---

## 7. PWA

- **manifest.json**: `display: standalone`, portrait, theme `#f7f3ef`
- **service-worker.js**: `CACHE_NAME = 't3-shell-v2'`. Cache-first cho shell (tất cả CSS/JS/icon files), network-first cho `assets/floor-*.png`
- **Cài đặt iOS**: `apple-mobile-web-app-capable`, `apple-touch-icon`
- SW chỉ hoạt động trên `http://localhost` hoặc `https`

---

## 8. Quy ước quan trọng khi chỉnh sửa

### Thêm POI mới
1. Thêm vào mảng `SAMPLE_POIS` trong `js/data.js`
2. Đặt `id` theo pattern `poi-{number}` (không trùng)
3. Cung cấp `links[]` kết nối với node lân cận cùng tầng hoặc liên tầng
4. `weight` = khoảng cách mét ước tính

### Thêm tầng mới
Hiện tại hardcode 3 tầng. Để thêm tầng 4+:
- Thêm vào `CONFIG.images`, `CONFIG.floorNames` trong `js/config.js`
- Thêm nút `.floor-btn` trong HTML
- Thêm màu trong `js/markers.js` (createPOIMarker) và `js/custom-nodes.js` (renderCustomPointsList)
- Thêm màu placeholder trong `js/map.js` (createPlaceholderLayers)

### Đổi kích thước ảnh
Sửa `CONFIG.imageWidth` và `CONFIG.imageHeight` trong `js/config.js` — ảnh hưởng đến bounds Leaflet và placeholder labels.

### Sửa tốc độ di chuyển
`WALKING_SPEED` trong `js/config.js` (mặc định 80 mét/phút).

### Sửa ngưỡng voucher
`VOUCHER_THRESHOLD` trong `js/config.js` (mặc định 50m).

### Thêm CSS mới
Mỗi component có file CSS riêng. Thêm file mới → thêm `<link>` vào `index.html` → thêm vào `APP_SHELL` trong `service-worker.js` → bump `CACHE_NAME`.

### Lưu ý Leaflet CRS.Simple
- **Không dùng lat/lng địa lý**. Mọi tọa độ là pixel của ảnh.
- Khi đọc `e.latlng` từ click event: `x = latlng.lng`, `y = latlng.lat`
- Khi tạo marker: `L.marker([y, x])` — thứ tự lat (y) trước lng (x)

### localStorage
- Key `hci-t3-custom-nodes`: custom nodes
- Key `hci-t3-poi-positions`: POI position overrides
- Custom node tự động kết nối với POI gần nhất cùng tầng trong `buildGraph()`

---

## 9. Các phụ thuộc ngoài (CDN)

| Thư viện | Version | Dùng cho |
|---|---|---|
| Leaflet.js | 1.9.4 | Bản đồ ảnh phẳng, markers, polyline |
| Google Fonts | — | Hanken Grotesk + Instrument Serif |

Không có package.json, không có build step, không có bundler.

---

## 10. Luồng tìm đường (flow tóm tắt)

```
User chọn điểm đi + đến
    → findRoute()                    [js/route.js]
    → buildGraph(getAllNodes())      [js/pathfinding.js] ← SAMPLE_POIS + customNodes + gpsNode
    → aStar(graph, fromId, toId)     [js/pathfinding.js] ← A*, heuristic Euclidean/PX_PER_M
    → drawPath(path)                 [js/route.js] ← polyline chỉ vẽ segment cùng floor
    → showRouteInfo(path, graph)     [js/route.js] ← tổng mét, thời gian, voucher nếu >50m
    → showRouteCard(path, graph)     [js/route.js] ← mobile route card
```

Khi chuyển tầng:
```
switchFloor(n)                        [js/map.js]
    → ẩn floor overlay cũ + markers cũ
    → hiện floor overlay mới + markers mới
    → drawPath(currentPath)           [js/route.js] ← vẽ lại segment thuộc tầng mới
```
