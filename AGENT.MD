# AGENT.MD — Ngữ cảnh dự án: Định tuyến nhà ga T3

> File này mô tả toàn bộ kiến trúc, logic và quy ước của project cho AI agent.
> Đọc kỹ trước khi thay đổi bất kỳ file nào.

---

## 1. Tổng quan dự án

**Tên:** Định tuyến trong nhà — Ga T3 Tân Sơn Nhất  
**Loại:** HCI Prototype — Progressive Web App (PWA)  
**Mục đích:** Cho phép hành khách tìm đường đi bộ trong nhà ga T3, sân bay Quốc tế Tân Sơn Nhất (TP.HCM).  
**Ngôn ngữ:** Vietnamese (UI), JavaScript (code comments cũng dùng tiếng Việt).  
**Stack:** Vanilla HTML + CSS + JavaScript, không dùng bất kỳ framework JS nào.

### Triển khai
- **Netlify** (`netlify.toml`) và **Vercel** (`vercel.json`) đã được cấu hình.
- Chạy local: `python3 -m http.server 5500` → `http://localhost:5500`

---

## 2. Cấu trúc thư mục

```
hci-t3/
├── index.html              # Trang duy nhất (SPA)
├── css/
│   └── style.css           # Toàn bộ CSS (877 dòng)
├── js/
│   └── app.js              # Toàn bộ logic JS (2120 dòng)
├── assets/
│   ├── floor-1.png         # Sơ đồ Tầng 2 (hành khách đến)
│   ├── floor-2.png         # Sơ đồ Tầng 3 (thương mại)
│   ├── floor-3.png         # Sơ đồ Tầng 4 (khởi hành)
│   └── icons/              # PWA icons (192px, 512px, apple-touch)
├── manifest.json           # PWA manifest
├── service-worker.js       # Service Worker (cache-first shell)
├── netlify.toml
├── vercel.json
└── README.md
```

---

## 3. Kiến trúc `js/app.js`

Toàn bộ logic nằm trong một IIFE module pattern:

```js
const App = (() => { ... })();
```

### 3.1 CONFIG (dòng 19–38)

```js
const CONFIG = {
  imageWidth:  1920,   // Chiều rộng ảnh sơ đồ (pixel)
  imageHeight: 1080,   // Chiều cao ảnh sơ đồ (pixel)
  images: { 1: 'assets/floor-1.png', 2: 'assets/floor-2.png', 3: 'assets/floor-3.png' },
  floorNames: { 1: 'Tầng 2 — Hành khách đến', 2: 'Tầng 3 — Thương mại', 3: 'Tầng 4 — Khởi hành' },
};
```

> **Quy ước tầng:** Internal floor `1/2/3` ↔ hiển thị `Tầng 2/3/4`.  
> Hàm `displayFloor(f)` = `f + 1` dùng ở mọi chỗ hiển thị tên tầng.

### 3.2 SAMPLE_POIS (dòng 51–989)

Mảng các node POI (Point of Interest). Mỗi node:

```js
{
  id: 'poi-{number}',   // ID duy nhất, string
  label: '🚻 Tên',      // Hiển thị trên bản đồ và dropdown
  x: 540,               // Pixel X từ trái (= Leaflet lng)
  y: 663,               // Pixel Y từ trên (= Leaflet lat)
  floor: 1,             // Internal floor: 1 | 2 | 3
  links: [
    { to: 'poi-{other}', weight: 15 },  // weight = mét
  ],
}
```

**Phân bổ node theo tầng:**
| Internal | Hiển thị | ID range | Nội dung |
|---|---|---|---|
| `floor: 1` | Tầng 2 | `poi-1` → `poi-53` | Hành khách đến, băng chuyền, thang, WC |
| `floor: 2` | Tầng 3 | `poi-101` → `poi-133` | Gates, thủ tục, thang cuốn, WC |
| `floor: 3` | Tầng 4 | `poi-201` → `poi-218` | Phòng khách VIP, thang máy/bộ |

**Liên tầng:** Các link `{ to: 'poi-209', weight: 10 }` nối giữa node tầng khác nhau (thang máy, thang bộ). Graph là undirected — mỗi link tự động được tạo ngược chiều.

**ID của node liên tầng quan trọng:**
- `poi-209`: Thang bộ T4 ↔ T2 (cánh trái)
- `poi-213`: Thang máy T4 ↔ T3 (cánh trái)
- `poi-214`: Thang máy T4 ↔ T2/T3 (giữa-trái)
- `poi-215`: Thang máy T4 ↔ T3 (giữa-phải)
- `poi-216`: Thang máy T4 ↔ T3 (phải)
- `poi-217`: Thang máy T4 ↔ T2 (cánh phải)
- `poi-218`: Thang bộ T4 ↔ T2 (cánh phải)

### 3.3 State (dòng 1003–1016)

```js
let currentFloor = 1;         // 1 | 2 | 3
let editMode = false;          // Chế độ đánh dấu điểm
let gpsMode = false;           // Chế độ GPS (click = đặt vị trí)
let gpsNode = null;            // Node GPS hiện tại (hoặc null)
let gpsMarker = null;          // Leaflet marker GPS
let customNodes = [];          // Điểm người dùng thêm (localStorage)
let currentPath = null;        // Mảng ID node của đường hiện tại
let currentPathLayer = null;   // Leaflet polyline layer
let markerLayers = {};         // { floor: [Leaflet marker, ...] }
let floorLayers = {};          // { floor: Leaflet imageOverlay | { rect, label } }
```

### 3.4 Các hàm chính

| Hàm | Mô tả |
|---|---|
| `initMap()` | Khởi tạo Leaflet với `CRS.Simple` (tọa độ pixel) |
| `buildGraph(pois)` | Xây undirected graph từ mảng POI; tự kết nối custom/GPS node với POI gần nhất cùng tầng |
| `aStar(graph, startId, endId)` | A* pathfinding; heuristic = Euclidean / 10 (pixel→mét) |
| `createFloorLayers(map)` | Tạo `L.imageOverlay` từ 3 ảnh sơ đồ |
| `createPlaceholderLayers(map)` | Tạo rectangle + label khi chưa có ảnh thật |
| `switchFloor(floorNum)` | Đổi tầng: ẩn/hiện overlay + markers + vẽ lại path |
| `createPOIMarker(node, map)` | Tạo `L.divIcon` pill-style; custom node thì draggable + right-click xóa |
| `placeMarkers(map)` | Đặt tất cả POI markers; chỉ add vào map nếu đúng floor hiện tại |
| `populateDropdowns()` | Fill `#from-select` và `#to-select` với tất cả node |
| `findRoute()` | Đọc dropdown → `buildGraph` → `aStar` → `drawPath` + `showRouteInfo` |
| `drawPath(path)` | Vẽ polyline chỉ cho các segment thuộc `currentFloor` |
| `showRouteInfo(path, graph)` | Tính tổng mét, ước thời gian (80m/phút); nếu > 50m thì random voucher |
| `clearRoute()` | Xóa polyline + reset dropdown |
| `addCustomNode(e)` | Click map trong edit mode → prompt tên → thêm node |
| `deleteCustomNode(nodeId)` | Xóa marker, xóa khỏi array, lưu localStorage |
| `saveCustomNodes()` / `loadCustomNodes()` | Persist vào `localStorage` key `hci-t3-custom-nodes` |
| `setGpsMode(enabled)` | Bật/tắt GPS mode; khi bật, click map = đặt vị trí GPS |
| `setGpsLocation(latlng)` | Tạo/cập nhật `gpsNode` và `gpsMarker`; tự tìm đường nếu đã có điểm đến |
| `exportCoords()` | Xuất JSON tọa độ custom nodes ra `#export-textarea` + clipboard |
| `refreshMarkers()` | Xóa sạch và đặt lại toàn bộ markers |
| `setupPanelToggle()` | Mobile: bottom sheet swipe/tap; desktop: luôn mở |
| `checkImagesExist()` | Synchronous HEAD request kiểm tra `floor-1.png` có tồn tại không |
| `registerServiceWorker()` | Đăng ký `service-worker.js` |

### 3.5 Public API (`App.*`)

```js
App.switchFloor(n)
App.findRoute()
App.clearRoute()
App.addCustomNode(e)
App.deleteCustomNode(nodeId)
App.exportCoords()
App.refreshMarkers()
App.renderCustomPointsList()
App.getCurrentFloor()     // → number
App.getCustomNodes()      // → array
App.getAllNodes()          // → SAMPLE_POIS + customNodes + gpsNode
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

## 5. CSS — Design System (`css/style.css`)

### Design tokens (`:root`)

```css
--font-display: "Instrument Serif", serif;
--font-body: "Hanken Grotesk", sans-serif;

--paper: #ffffff;
--panel: #ffffff;
--ink: #1f1a16;
--muted: #6f675f;
--line: rgba(31, 26, 22, 0.12);
--accent: #ff6b35;          /* màu cam chính */
--accent-strong: #e15423;
--accent-soft: rgba(255, 107, 53, 0.18);

--topbar-h: 66px;
--panel-w: 360px;
--sheet-peek: 74px;         /* chiều cao bottom sheet thu nhỏ (mobile) */
```

### Màu marker theo tầng

| Floor (internal) | Màu |
|---|---|
| 1 (Tầng 2) | `#ff6b35` (cam) |
| 2 (Tầng 3) | `#0066cc` (xanh dương) |
| 3 (Tầng 4) | `#28a745` (xanh lá) |

### Responsive breakpoints

| Breakpoint | Thay đổi |
|---|---|
| `≤ 1100px` | `--panel-w: 320px` |
| `≤ 900px` | Panel thành bottom sheet (65vh), topbar dọc, toggle button hiện |
| `≤ 600px` | Panel 72vh, font nhỏ hơn |
| `≥ 901px` | `#panel-toggle` ẩn (desktop luôn mở panel) |

### Component chính

- `.topbar` — sticky header, blur backdrop
- `.side-panel` — sidebar (desktop) / bottom sheet (mobile)
- `.panel-grip` — drag handle (chỉ hiện mobile)
- `.panel-section` — card trong panel với border-radius 18px
- `.poi-pill` — label marker trên bản đồ, dùng `--poi-color` CSS var
- `.poi-pill.is-custom` — dashed border cho custom node
- `.gps-dot` — marker GPS (chấm xanh với pulse ring)
- `.route-info` — section chi tiết tuyến với border-left accent
- `.voucher-banner` — banner voucher màu cam/vàng

---

## 6. HTML — `index.html`

Cấu trúc DOM:

```
body.app
├── header.topbar
│   ├── .brand (.brand-mark "T3" + .brand-text h1)
│   └── .topbar-actions
│       ├── .floor-tabs#floor-tabs (3 button.floor-btn[data-floor="1/2/3"])
│       └── button#panel-toggle
├── div.layout
│   ├── aside.side-panel#side-panel
│   │   ├── .panel-grip
│   │   ├── .panel-header
│   │   └── .panel-scroll
│   │       ├── section.panel-section (route form: #from-select, #to-select, buttons)
│   │       ├── section#gps-section (GPS toggle)
│   │       ├── section#route-info.hidden (chi tiết tuyến #route-details)
│   │       ├── section.panel-section (edit mode toggle)
│   │       └── section#manage-points-section.hidden (custom points list)
│   ├── div.panel-backdrop#panel-backdrop
│   └── main.map-area
│       └── div#map
└── script[src="js/app.js"]
```

---

## 7. PWA

- **manifest.json**: `display: standalone`, portrait, theme `#f7f3ef`
- **service-worker.js**: Cache-first cho shell (HTML/CSS/JS/icons); network-first cho `assets/floor-*.png`
- **Cài đặt iOS**: `apple-mobile-web-app-capable`, `apple-touch-icon`
- SW chỉ hoạt động trên `http://localhost` hoặc `https`

---

## 8. Quy ước quan trọng khi chỉnh sửa

### Thêm POI mới
1. Thêm vào mảng `SAMPLE_POIS` trong `app.js`
2. Đặt `id` theo pattern `poi-{number}` (không trùng)
3. Cung cấp `links[]` kết nối với node lân cận cùng tầng hoặc liên tầng
4. `weight` = khoảng cách mét ước tính

### Thêm tầng mới
Hiện tại hardcode 3 tầng. Để thêm tầng 4+:
- Thêm vào `CONFIG.images`, `CONFIG.floorNames`
- Thêm nút `.floor-btn` trong HTML
- Thêm màu trong `createPOIMarker` và `renderCustomPointsList`
- Thêm màu trong `createPlaceholderLayers`

### Đổi kích thước ảnh
Sửa `CONFIG.imageWidth` và `CONFIG.imageHeight` — ảnh hưởng đến bounds Leaflet và placeholder labels.

### Sửa tốc độ di chuyển
Dòng 1580: `const timeMin = Math.round(totalWeight / 80)` — `80` là mét/phút.

### Sửa ngưỡng voucher
Dòng 1585: `if (totalWeight > 50)` — quãng đường > 50m thì hiện voucher.

### Lưu ý Leaflet CRS.Simple
- **Không dùng lat/lng địa lý**. Mọi tọa độ là pixel của ảnh.
- Khi đọc `e.latlng` từ click event: `x = latlng.lng`, `y = latlng.lat`
- Khi tạo marker: `L.marker([y, x])` — thứ tự lat (y) trước lng (x)

### localStorage
- Key: `hci-t3-custom-nodes`
- Giá trị: JSON array các custom node
- Custom node bị tự động kết nối với POI gần nhất cùng tầng trong `buildGraph`

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
    → findRoute()
    → buildGraph(getAllNodes())       ← SAMPLE_POIS + customNodes + gpsNode
    → aStar(graph, fromId, toId)     ← A*, heuristic Euclidean/10
    → drawPath(path)                 ← polyline chỉ vẽ segment cùng floor hiện tại
    → showRouteInfo(path, graph)     ← tổng mét, thời gian, voucher nếu >50m
```

Khi chuyển tầng:
```
switchFloor(n)
    → ẩn floor overlay cũ + markers cũ
    → hiện floor overlay mới + markers mới
    → drawPath(currentPath) để vẽ lại segment thuộc tầng mới
```
