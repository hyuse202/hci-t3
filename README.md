# 🚏 Định tuyến trong nhà — Ga T3 Tân Sơn Nhất
**Môn HCI — Prototype định tuyến đường đi trong nhà ga**

---

## 📁 Cấu trúc thư mục

```
hci-t3/
├── index.html          # Trang chính
├── css/
│   └── style.css       # Giao diện
├── js/
│   └── app.js          # Logic: bản đồ, routing, đánh dấu
├── assets/             # 📌 Bỏ 3 ảnh sơ đồ vào đây
│   ├── floor-1.png     # Tầng 1
│   ├── floor-2.png     # Tầng 2
│   └── floor-3.png     # Tầng 3
└── README.md
```

---

## 🚀 Cách chạy

### Cách 1 — Mở trực tiếp (đơn giản nhất)
Mở file `index.html` bằng **Brave** (hoặc Chrome/Firefox) là chạy được ngay.
> ⚠️ Nếu mở file:// có thể không load được ảnh — dùng cách 2 an toàn hơn.

### Cách 2 — Live Server (khuyên dùng)
Trong terminal:
```bash
cd /home/hyuse/__WORKSPACE__/uni/hci-t3
python3 -m http.server 5500
```
Sau đó vào trình duyệt gõ: `http://localhost:5500`

---

## 🖼️ Hướng dẫn gắn ảnh sơ đồ

### Bước 1: Đặt ảnh
Copy 3 ảnh vào thư mục `assets/` với tên:
- `floor-1.png` — Tầng 1
- `floor-2.png` — Tầng 2
- `floor-3.png` — Tầng 3

> Hỗ trợ `.png`, `.jpg`, `.webp`

### Bước 2: Đo kích thước
Mở ảnh trong trình duyệt, mở **Developer Tools (F12) → Console**, gõ:
```js
// Xem kích thước ảnh
var img = new Image();
img.onload = function() { console.log(this.width + 'x' + this.height); };
img.src = 'assets/floor-1.png';
```

### Bước 3: Sửa kích thước trong config
Mở `js/app.js`, dòng ~20, sửa:
```js
const CONFIG = {
  imageWidth:  1920,   // ← sửa số này
  imageHeight: 1080,   // ← sửa số này
  // ...
};
```

### Bước 4: Tắt chế độ placeholder
Tìm dòng `return false;` trong hàm `checkImagesExist()` (cuối file):
```js
// Đổi từ:
return false;
// Thành:
return true;
```

---

## 📍 Hướng dẫn đánh tọa độ địa điểm

### Cách 1 — Click trực tiếp trên bản đồ (dễ nhất)
1. Bật **"🖊️ Chế độ đánh dấu"** ở panel trái
2. Click vào vị trí bất kỳ trên bản đồ
3. Gõ tên địa điểm → tự động thêm vào danh sách

### Cách 2 — Sửa tọa độ trong code (chính xác nhất)
Mở `js/app.js`, tìm mảng `SAMPLE_POIS`, mỗi điểm có cấu trúc:
```js
{
  id: 'f1-entrance',        // ID duy nhất
  label: '🚪 Cửa vào chính', // Tên hiển thị
  x: 200,                    // Tọa độ X (trái → phải)
  y: 900,                    // Tọa độ Y (trên → dưới)
  floor: 1,                  // Tầng (1, 2, hoặc 3)
  links: [                   // Kết nối đến các điểm khác
    { to: 'f1-checkin-a', weight: 40 },   // weight = khoảng cách (mét)
    { to: 'f1-info',      weight: 15 },
  ],
},
```

### Cách lấy tọa độ từ ảnh
1. Mở ảnh trong trình duyệt
2. Bật chế độ đánh dấu
3. Click vào vị trí muốn đánh → nhập tên
4. Vào Console (F12) gõ:
   ```js
   App.getAllNodes()
   ```
   Coi tọa độ `x` và `y` của điểm vừa thêm, ghi lại để sửa trong code sau.

---

## 🧭 Cách dùng app

| Chức năng | Cách dùng |
|---|---|
| **Chuyển tầng** | Click Tầng 1 / Tầng 2 / Tầng 3 ở header |
| **Chọn điểm đi** | Click marker trên bản đồ, hoặc chọn trong dropdown |
| **Tìm đường** | Chọn điểm đi + đến → bấm "🚶 Tìm đường" |
| **Thêm điểm mới** | Bật chế độ đánh dấu → click bản đồ |
| **Xoá đường** | Bấm "🗑️ Xoá" |

---

## ⚙️ Công nghệ

- **Leaflet.js** (CRS.Simple) — bản đồ ảnh phẳng
- **A\* Pathfinding** — tìm đường ngắn nhất
- **Vanilla JS** — không cần framework, mở là chạy

---

## 📝 Ghi chú

- Các điểm mẫu trong code là giả định. Anh nên xoá hết `SAMPLE_POIS` và tự đánh từ đầu cho chính xác.
- Để thêm kết nối liên tầng, tạo link giữa node tầng này và node tầng kia.
- Khi chuyển tầng, đường đi sẽ chỉ hiện các segment thuộc tầng đó.