/**
 * NHÀ GA T3 — Ứng dụng định tuyến trong nhà
 * HCI Prototype — Leaflet.js + A* Pathfinding
 *
 * ✅ Cách dùng:
 *   1. Đặt 3 ảnh sơ đồ vào thư mục assets/ với tên:
 *      - floor-1.png  (Tầng 1)
 *      - floor-2.png  (Tầng 2)
 *      - floor-3.png  (Tầng 3)
 *   2. Mở index.html trên browser (Live Server hoặc trực tiếp)
 *   3. Bật "Chế độ đánh dấu" → click vào bản đồ để thêm điểm
 *   4. Chọn điểm đi/đến → bấm "Tìm đường"
 */

/* ============================================================
   CẤU HÌNH — Anh sửa các thông số này cho khớp với ảnh thật
   ============================================================ */

const CONFIG = {
  // --- Kích thước ảnh (pixel) ---
  // Bỏ ảnh vô assets/, đo kích thước, sửa lại các số này
  imageWidth:  1920,
  imageHeight: 1080,

  // --- Đường dẫn ảnh ---
  images: {
    1: 'assets/floor-1.png',   // Tầng 1
    2: 'assets/floor-2.png',   // Tầng 2
    3: 'assets/floor-3.png',   // Tầng 3
  },

  // --- Tên hiển thị ---
  floorNames: {
    1: 'Tầng 1 — Hành khách đến',
    2: 'Tầng 2 — Thương mại',
    3: 'Tầng 3 — Khởi hành',
  },
};

/* ============================================================
   DỮ LIỆU MẪU — Các địa điểm trong nhà ga
   ============================================================
   Anh sửa tọa độ (x, y) cho khớp với ảnh sau khi đã đặt ảnh vô.
   - x: từ TRÁI sang PHẢI (0 = mép trái ảnh)
   - y: từ TRÊN xuống DƯỚI (0 = mép trên ảnh)
   - floor: 1 | 2 | 3
   - Các node có kết nối với nhau thì đặt tên trong links[]
   - weight = khoảng cách thực tế (mét) — để tính thời gian di chuyển
*/

const SAMPLE_POIS = [
  // ===== TẦNG 1 — Dữ liệu thật từ sơ đồ ga T3 =====
  {
    id: 'poi-1',
    label: '🛗 Thang máy',
    x: 99, y: 698,
    floor: 1,
    links: [
      { to: 'poi-2', weight: 6 },
      { to: 'poi-3', weight: 4 },
      { to: 'poi-209', weight: 10 },  // liên tầng → T3 Thang bộ
    ],
  },
  {
    id: 'poi-2',
    label: '🚬 Phòng hút thuốc',
    x: 122, y: 643,
    floor: 1,
    links: [
      { to: 'poi-1', weight: 6 },
      { to: 'poi-3', weight: 3 },
    ],
  },
  {
    id: 'poi-3',
    label: '🔼 Thang cuốn',
    x: 98, y: 663,
    floor: 1,
    links: [
      { to: 'poi-1', weight: 4 },
      { to: 'poi-2', weight: 3 },
      { to: 'poi-5', weight: 19 },
      { to: 'poi-209', weight: 10 },  // liên tầng → T3 Thang bộ
    ],
  },
  {
    id: 'poi-4',
    label: '🚻 Nhà vệ sinh',
    x: 340, y: 728,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 7 },
      { to: 'poi-8', weight: 23 },
    ],
  },
  {
    id: 'poi-5',
    label: '🔼 Thang cuốn',
    x: 290, y: 675,
    floor: 1,
    links: [
      { to: 'poi-3', weight: 19 },
      { to: 'poi-4', weight: 7 },
      { to: 'poi-6', weight: 9 },
      { to: 'poi-7', weight: 8 },
    ],
  },
  {
    id: 'poi-6',
    label: '🔼 Thang cuốn',
    x: 370, y: 624,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 9 },
      { to: 'poi-7', weight: 4 },
    ],
  },
  {
    id: 'poi-7',
    label: '🚻 Nhà vệ sinh',
    x: 333, y: 607,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 8 },
      { to: 'poi-6', weight: 4 },
    ],
  },
  {
    id: 'poi-8',
    label: '🛗 Thang máy',
    x: 564, y: 709,
    floor: 1,
    links: [
      { to: 'poi-4', weight: 23 },
      { to: 'poi-9', weight: 3 },
      { to: 'poi-214', weight: 5 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-9',
    label: '🔼 Thang cuốn',
    x: 560, y: 680,
    floor: 1,
    links: [
      { to: 'poi-8', weight: 3 },
      { to: 'poi-214', weight: 5 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-10',
    label: '🚬 Phòng hút thuốc lá',
    x: 1844, y: 646,
    floor: 1,
    links: [
      { to: 'poi-11', weight: 5 },
    ],
  },
  {
    id: 'poi-11',
    label: '🛗 Thang máy',
    x: 1863, y: 688,
    floor: 1,
    links: [
      { to: 'poi-10', weight: 5 },
      { to: 'poi-208', weight: 10 },  // liên tầng → T3 Techcombank
    ],
  },
  {
    id: 'poi-12',
    label: '☕ Cà phê, ăn nhanh giải khát',
    x: 1444, y: 441,
    floor: 1,
    links: [
      { to: 'poi-16', weight: 29 },
    ],
  },
  {
    id: 'poi-13',
    label: '🚪 A1',
    x: 660, y: 439,
    floor: 1,
    links: [
      { to: 'poi-14', weight: 8 },
      { to: 'poi-9', weight: 25 },
      { to: 'poi-214', weight: 10 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-14',
    label: '🚪 A2',
    x: 743, y: 439,
    floor: 1,
    links: [
      { to: 'poi-13', weight: 8 },
      { to: 'poi-15', weight: 33 },
    ],
  },
  {
    id: 'poi-15',
    label: '🚪 A3',
    x: 1070, y: 438,
    floor: 1,
    links: [
      { to: 'poi-14', weight: 33 },
      { to: 'poi-16', weight: 8 },
      { to: 'poi-215', weight: 10 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-16',
    label: '🚪 A4',
    x: 1154, y: 433,
    floor: 1,
    links: [
      { to: 'poi-12', weight: 29 },
      { to: 'poi-15', weight: 8 },
      { to: 'poi-37', weight: 10 },
    ],
  },
  {
    id: 'poi-31',
    label: '🛄 Băng chuyền trả hành lý',
    x: 672, y: 528,
    floor: 1,
    links: [
      { to: 'poi-13', weight: 9 },
      { to: 'poi-32', weight: 8 },
    ],
  },
  {
    id: 'poi-32',
    label: '🛄 Băng chuyền trả hành lý',
    x: 750, y: 532,
    floor: 1,
    links: [
      { to: 'poi-31', weight: 8 },
      { to: 'poi-33', weight: 8 },
    ],
  },
  {
    id: 'poi-33',
    label: '🛄 Băng chuyền trả hành lý',
    x: 828, y: 529,
    floor: 1,
    links: [
      { to: 'poi-32', weight: 8 },
      { to: 'poi-34', weight: 8 },
    ],
  },
  {
    id: 'poi-34',
    label: '🛄 Băng chuyền trả hành lý',
    x: 908, y: 530,
    floor: 1,
    links: [
      { to: 'poi-33', weight: 8 },
      { to: 'poi-35', weight: 8 },
    ],
  },
  {
    id: 'poi-35',
    label: '🛄 Băng chuyền trả hành lý',
    x: 990, y: 531,
    floor: 1,
    links: [
      { to: 'poi-34', weight: 8 },
      { to: 'poi-36', weight: 8 },
    ],
  },
  {
    id: 'poi-36',
    label: '🛄 Băng chuyền trả hành lý',
    x: 1068, y: 529,
    floor: 1,
    links: [
      { to: 'poi-35', weight: 8 },
      { to: 'poi-37', weight: 8 },
      { to: 'poi-15', weight: 9 },
    ],
  },
  {
    id: 'poi-37',
    label: '🛄 Băng chuyền trả hành lý',
    x: 1151, y: 531,
    floor: 1,
    links: [
      { to: 'poi-36', weight: 8 },
      { to: 'poi-38', weight: 7 },
      { to: 'poi-16', weight: 10 },
    ],
  },
  {
    id: 'poi-38',
    label: '🛄 Băng chuyền trả hành lý',
    x: 1225, y: 529,
    floor: 1,
    links: [
      { to: 'poi-37', weight: 7 },
      { to: 'poi-39', weight: 8 },
    ],
  },
  {
    id: 'poi-39',
    label: '🛄 Băng chuyền trả hành lý',
    x: 1306, y: 523,
    floor: 1,
    links: [
      { to: 'poi-38', weight: 8 },
    ],
  },
  {
    id: 'poi-41',
    label: '🔼 Thang cuốn',
    x: 758, y: 644,
    floor: 1,
    links: [
      { to: 'poi-44', weight: 3 },
      { to: 'poi-48', weight: 6 },
    ],
  },
  {
    id: 'poi-42',
    label: '🔼 Thang cuốn',
    x: 1277, y: 644,
    floor: 1,
    links: [
      { to: 'poi-47', weight: 5 },
      { to: 'poi-39', weight: 12 },
    ],
  },
  {
    id: 'poi-43',
    label: '🔼 Thang cuốn',
    x: 1503, y: 643,
    floor: 1,
    links: [
      { to: 'poi-45', weight: 5 },
      { to: 'poi-49', weight: 6 },
    ],
  },
  {
    id: 'poi-44',
    label: '🛗 Thang máy',
    x: 785, y: 640,
    floor: 1,
    links: [
      { to: 'poi-41', weight: 3 },
      { to: 'poi-48', weight: 7 },
      { to: 'poi-214', weight: 5 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-45',
    label: '🛗 Thang máy',
    x: 1456, y: 646,
    floor: 1,
    links: [
      { to: 'poi-43', weight: 5 },
      { to: 'poi-46', weight: 13 },
      { to: 'poi-218', weight: 3 },  // liên tầng → T3 Thang bộ
    ],
  },
  {
    id: 'poi-46',
    label: '🛗 Thang máy',
    x: 1572, y: 728,
    floor: 1,
    links: [
      { to: 'poi-45', weight: 13 },
      { to: 'poi-50', weight: 6 },
      { to: 'poi-217', weight: 3 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-47',
    label: '🛗 Thang máy',
    x: 1311, y: 685,
    floor: 1,
    links: [
      { to: 'poi-42', weight: 5 },
      { to: 'poi-216', weight: 6 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-48',
    label: '🚻 Nhà vệ sinh',
    x: 766, y: 706,
    floor: 1,
    links: [
      { to: 'poi-41', weight: 6 },
      { to: 'poi-44', weight: 7 },
    ],
  },
  {
    id: 'poi-49',
    label: '🚻 Nhà vệ sinh',
    x: 1503, y: 706,
    floor: 1,
    links: [
      { to: 'poi-43', weight: 6 },
      { to: 'poi-50', weight: 10 },
    ],
  },
  {
    id: 'poi-50',
    label: '🚻 Nhà vệ sinh',
    x: 1602, y: 676,
    floor: 1,
    links: [
      { to: 'poi-46', weight: 6 },
      { to: 'poi-49', weight: 10 },
    ],
  },
  {
    id: 'poi-51',
    label: '🚻 Nhà vệ sinh',
    x: 1351, y: 450,
    floor: 1,
    links: [
      { to: 'poi-12', weight: 9 },
      { to: 'poi-52', weight: 11 },
    ],
  },
  {
    id: 'poi-52',
    label: '🛗 Thang máy',
    x: 1237, y: 432,
    floor: 1,
    links: [
      { to: 'poi-51', weight: 11 },
      { to: 'poi-16', weight: 8 },
      { to: 'poi-215', weight: 10 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-53',
    label: '🚻 Nhà vệ sinh',
    x: 541, y: 613,
    floor: 1,
    links: [
      { to: 'poi-9', weight: 7 },
      { to: 'poi-8', weight: 10 },
    ],
  },

  // ===== TẦNG 2 — Dữ liệu thật từ sơ đồ ga T3 =====
  // --- Gate (cửa khởi hành) ---
  {
    id: 'poi-101',
    label: '🚪 Gate 10',
    x: 594, y: 846,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 17 },
      { to: 'poi-119', weight: 24 },
    ],
  },
  {
    id: 'poi-102',
    label: '🚪 Gate 11',
    x: 760, y: 837,
    floor: 2,
    links: [
      { to: 'poi-101', weight: 17 },
      { to: 'poi-104', weight: 15 },
      { to: 'poi-122', weight: 10 },
    ],
  },
  {
    id: 'poi-103',
    label: '🚪 Gate 13',
    x: 1076, y: 855,
    floor: 2,
    links: [
      { to: 'poi-104', weight: 17 },
      { to: 'poi-105', weight: 20 },
      { to: 'poi-118', weight: 7 },
    ],
  },
  {
    id: 'poi-104',
    label: '🚪 Gate 12',
    x: 911, y: 861,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 15 },
      { to: 'poi-103', weight: 17 },
    ],
  },
  {
    id: 'poi-105',
    label: '🚪 Gate 14',
    x: 1280, y: 847,
    floor: 2,
    links: [
      { to: 'poi-103', weight: 20 },
      { to: 'poi-106', weight: 16 },
    ],
  },
  {
    id: 'poi-106',
    label: '🚪 Gate 15',
    x: 1441, y: 841,
    floor: 2,
    links: [
      { to: 'poi-105', weight: 16 },
      { to: 'poi-124', weight: 5 },
    ],
  },
  // --- Cổng D ---
  {
    id: 'poi-107',
    label: '🚪 D1',
    x: 493, y: 525,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 15 },
      { to: 'poi-114', weight: 9 },
    ],
  },
  {
    id: 'poi-108',
    label: '🚪 D2',
    x: 641, y: 520,
    floor: 2,
    links: [
      { to: 'poi-107', weight: 15 },
      { to: 'poi-109', weight: 6 },
      { to: 'poi-115', weight: 10 },
      { to: 'poi-116', weight: 15 },
    ],
  },
  {
    id: 'poi-109',
    label: '🚪 D3',
    x: 697, y: 515,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 6 },
    ],
  },
  {
    id: 'poi-110',
    label: '🚪 D4',
    x: 1056, y: 520,
    floor: 2,
    links: [
      { to: 'poi-111', weight: 5 },
      { to: 'poi-117', weight: 12 },  // nối hành lang chính
    ],
  },
  {
    id: 'poi-111',
    label: '🚪 D5',
    x: 1105, y: 520,
    floor: 2,
    links: [
      { to: 'poi-110', weight: 5 },
      { to: 'poi-112', weight: 18 },
    ],
  },
  {
    id: 'poi-112',
    label: '🚪 D6',
    x: 1288, y: 519,
    floor: 2,
    links: [
      { to: 'poi-111', weight: 18 },
      { to: 'poi-113', weight: 5 },
    ],
  },
  {
    id: 'poi-113',
    label: '🚪 D7',
    x: 1340, y: 520,
    floor: 2,
    links: [
      { to: 'poi-112', weight: 5 },
    ],
  },
  // --- Thang cuốn ---
  {
    id: 'poi-114',
    label: '🔼 Thang cuốn',
    x: 406, y: 521,
    floor: 2,
    links: [
      { to: 'poi-107', weight: 9 },
      { to: 'poi-115', weight: 13 },
      { to: 'poi-27', weight: 5 },   // liên tầng → T1 Thang máy
      { to: 'poi-213', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-115',
    label: '🔼 Thang cuốn',
    x: 540, y: 517,
    floor: 2,
    links: [
      { to: 'poi-114', weight: 13 },
      { to: 'poi-108', weight: 10 },
      { to: 'poi-9', weight: 5 },    // liên tầng → T1 Thang cuốn
      { to: 'poi-214', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-116',
    label: '🔼 Thang cuốn',
    x: 795, y: 518,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 15 },
      { to: 'poi-117', weight: 14 },
      { to: 'poi-44', weight: 5 },   // liên tầng → T1 Thang máy
      { to: 'poi-214', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-117',
    label: '🔼 Thang cuốn',
    x: 937, y: 518,
    floor: 2,
    links: [
      { to: 'poi-116', weight: 14 },
      { to: 'poi-44', weight: 5 },   // liên tầng → T1 Thang máy
      { to: 'poi-214', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-118',
    label: '🔼 Thang cuốn',
    x: 1134, y: 824,
    floor: 2,
    links: [
      { to: 'poi-103', weight: 7 },
      { to: 'poi-123', weight: 5 },
      { to: 'poi-215', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-119',
    label: '🔼 Thang cuốn',
    x: 354, y: 849,
    floor: 2,
    links: [
      { to: 'poi-101', weight: 24 },
      { to: 'poi-121', weight: 10 },
    ],
  },
  {
    id: 'poi-120',
    label: '🔼 Thang cuốn',
    x: 494, y: 778,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 17 },
      { to: 'poi-130', weight: 15 },
    ],
  },
  {
    id: 'poi-121',
    label: '🔼 Thang cuốn',
    x: 326, y: 752,
    floor: 2,
    links: [
      { to: 'poi-119', weight: 10 },
      { to: 'poi-120', weight: 17 },
      { to: 'poi-130', weight: 3 },
      { to: 'poi-126', weight: 12 },
      { to: 'poi-213', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-122',
    label: '🔼 Thang cuốn',
    x: 727, y: 742,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 10 },
      { to: 'poi-120', weight: 24 },
      { to: 'poi-116', weight: 23 },
      { to: 'poi-44', weight: 5 },   // liên tầng → T1 Thang máy
    ],
  },
  {
    id: 'poi-123',
    label: '🔼 Thang cuốn',
    x: 1124, y: 870,
    floor: 2,
    links: [
      { to: 'poi-118', weight: 5 },
      { to: 'poi-127', weight: 17 },
      { to: 'poi-215', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-124',
    label: '🔼 Thang cuốn',
    x: 1491, y: 851,
    floor: 2,
    links: [
      { to: 'poi-106', weight: 5 },
      { to: 'poi-125', weight: 8 },
    ],
  },
  {
    id: 'poi-125',
    label: '🔼 Thang cuốn',
    x: 1500, y: 774,
    floor: 2,
    links: [
      { to: 'poi-124', weight: 8 },
      { to: 'poi-132', weight: 4 },
    ],
  },
  // --- Thủ tục hàng không ---
  {
    id: 'poi-126',
    label: '📋 Thủ tục hàng không',
    x: 429, y: 694,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 12 },
      { to: 'poi-130', weight: 11 },
    ],
  },
  {
    id: 'poi-127',
    label: '📋 Thủ tục hàng không',
    x: 1077, y: 701,
    floor: 2,
    links: [
      { to: 'poi-123', weight: 17 },
      { to: 'poi-128', weight: 22 },
    ],
  },
  {
    id: 'poi-128',
    label: '📋 Thủ tục hàng không',
    x: 1298, y: 702,
    floor: 2,
    links: [
      { to: 'poi-127', weight: 22 },
      { to: 'poi-125', weight: 22 },
    ],
  },
  // --- Thang máy & WC ---
  {
    id: 'poi-129',
    label: '🛗 Thang máy',
    x: 56, y: 824,
    floor: 2,
    links: [
      { to: 'poi-131', weight: 6 },
      { to: 'poi-209', weight: 10 },  // liên tầng → T3 Thang bộ
    ],
  },
  {
    id: 'poi-130',
    label: '🛗 Thang máy',
    x: 349, y: 777,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 3 },
      { to: 'poi-120', weight: 15 },
      { to: 'poi-126', weight: 11 },
      { to: 'poi-213', weight: 5 },   // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-131',
    label: '🔼 Thang cuốn',
    x: 79, y: 770,
    floor: 2,
    links: [
      { to: 'poi-129', weight: 6 },
      { to: 'poi-209', weight: 10 },  // liên tầng → T3 Thang bộ
    ],
  },
  {
    id: 'poi-132',
    label: '🚻 Nhà vệ sinh',
    x: 1517, y: 738,
    floor: 2,
    links: [
      { to: 'poi-125', weight: 4 },
    ],
  },
  {
    id: 'poi-133',
    label: '🔼 Thang cuốn',
    x: 1843, y: 771,
    floor: 2,
    links: [
      { to: 'poi-10', weight: 8 },    // liên tầng → T1 Phòng hút thuốc lá
      { to: 'poi-208', weight: 10 },   // liên tầng → T3 Techcombank
    ],
  },

  // ===== TẦNG 3 — Dữ liệu thật từ sơ đồ ga T3 =====
  {
    id: 'poi-201',
    label: '💺 Phòng khách The Sens',
    x: 178, y: 658,
    floor: 3,
    links: [
      { to: 'poi-202', weight: 30 },
      { to: 'poi-209', weight: 16 },
    ],
  },
  {
    id: 'poi-202',
    label: '💺 Phòng khách Bông Sen',
    x: 479, y: 654,
    floor: 3,
    links: [
      { to: 'poi-201', weight: 30 },
      { to: 'poi-203', weight: 38 },
      { to: 'poi-213', weight: 11 },
    ],
  },
  {
    id: 'poi-203',
    label: '💺 Phòng khách SH Airport Lounge',
    x: 859, y: 653,
    floor: 3,
    links: [
      { to: 'poi-202', weight: 38 },
      { to: 'poi-204', weight: 23 },
      { to: 'poi-214', weight: 20 },
    ],
  },
  {
    id: 'poi-204',
    label: '💺 Phòng khách Bông Sen',
    x: 1091, y: 658,
    floor: 3,
    links: [
      { to: 'poi-203', weight: 23 },
      { to: 'poi-205', weight: 14 },
      { to: 'poi-215', weight: 18 },
    ],
  },
  {
    id: 'poi-205',
    label: '💺 Phòng khách thương gia Nam A Bank',
    x: 1228, y: 655,
    floor: 3,
    links: [
      { to: 'poi-204', weight: 14 },
      { to: 'poi-206', weight: 17 },
      { to: 'poi-212', weight: 8 },
      { to: 'poi-216', weight: 15 },
    ],
  },
  {
    id: 'poi-206',
    label: '💺 VIP A - ACV Cảng HKQT Tân Sơn Nhất',
    x: 1401, y: 655,
    floor: 3,
    links: [
      { to: 'poi-205', weight: 17 },
      { to: 'poi-207', weight: 30 },
      { to: 'poi-216', weight: 6 },
      { to: 'poi-218', weight: 10 },
    ],
  },
  {
    id: 'poi-207',
    label: '💺 Phòng khách Vietcombank',
    x: 1699, y: 649,
    floor: 3,
    links: [
      { to: 'poi-206', weight: 30 },
      { to: 'poi-208', weight: 15 },
      { to: 'poi-217', weight: 13 },
    ],
  },
  {
    id: 'poi-208',
    label: '💺 Phòng khách Techcombank',
    x: 1844, y: 653,
    floor: 3,
    links: [
      { to: 'poi-207', weight: 15 },
    ],
  },
  {
    id: 'poi-209',
    label: '🚪 Thang bộ',
    x: 326, y: 705,
    floor: 3,
    links: [
      { to: 'poi-201', weight: 16 },
      { to: 'poi-213', weight: 6 },
    ],
  },
  {
    id: 'poi-210',
    label: '🚪 Thang bộ',
    x: 708, y: 725,
    floor: 3,
    links: [
      { to: 'poi-214', weight: 4 },
      { to: 'poi-203', weight: 17 },
    ],
  },
  {
    id: 'poi-211',
    label: '🚪 Thang bộ',
    x: 1133, y: 800,
    floor: 3,
    links: [
      { to: 'poi-215', weight: 6 },
      { to: 'poi-204', weight: 15 },
    ],
  },
  {
    id: 'poi-212',
    label: '🚪 Thang bộ',
    x: 1276, y: 715,
    floor: 3,
    links: [
      { to: 'poi-216', weight: 9 },
      { to: 'poi-205', weight: 8 },
    ],
  },
  {
    id: 'poi-213',
    label: '🛗 Thang máy',
    x: 381, y: 713,
    floor: 3,
    links: [
      { to: 'poi-202', weight: 11 },
      { to: 'poi-209', weight: 6 },
    ],
  },
  {
    id: 'poi-214',
    label: '🛗 Thang máy',
    x: 666, y: 714,
    floor: 3,
    links: [
      { to: 'poi-203', weight: 20 },
      { to: 'poi-210', weight: 4 },
    ],
  },
  {
    id: 'poi-215',
    label: '🛗 Thang máy',
    x: 1197, y: 807,
    floor: 3,
    links: [
      { to: 'poi-211', weight: 6 },
      { to: 'poi-204', weight: 18 },
    ],
  },
  {
    id: 'poi-216',
    label: '🛗 Thang máy',
    x: 1369, y: 704,
    floor: 3,
    links: [
      { to: 'poi-206', weight: 6 },
      { to: 'poi-212', weight: 9 },
      { to: 'poi-205', weight: 15 },
    ],
  },
  {
    id: 'poi-217',
    label: '🛗 Thang máy',
    x: 1587, y: 704,
    floor: 3,
    links: [
      { to: 'poi-207', weight: 13 },
      { to: 'poi-218', weight: 10 },
    ],
  },
  {
    id: 'poi-218',
    label: '🚪 Thang bộ',
    x: 1501, y: 661,
    floor: 3,
    links: [
      { to: 'poi-206', weight: 10 },
      { to: 'poi-217', weight: 10 },
    ],
  },
];

/* ============================================================
   ỨNG DỤNG — Không cần sửa gì bên dưới nha anh
   ============================================================ */

const App = (() => {
  'use strict';

  // --- State ---
  let currentFloor = 1;
  let editMode = false;
  let gpsMode = false;
  let gpsNode = null;
  let gpsMarker = null;
  let customNodes = [];
  let currentPath = null;
  let currentPathLayer = null;
  let markerLayers = {};
  let floorLayers = {};
  let currentFloorLayer = null;
  let lastClickCoords = null;
  let allMarkerData = {}; // lưu ref marker để xóa/kéo

  // Key localStorage
  const STORAGE_KEY = 'hci-t3-custom-nodes';

  // Graph (xây từ POIs)
  let graph = {};

  // DOM refs
  const els = {};

  // --- Map init ---
  function initMap() {
    const map = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: -1,
      maxZoom: 3,
      zoomSnap: 0.5,
      zoomControl: true,
    });

    // Center map
    const cx = CONFIG.imageWidth / 2;
    const cy = CONFIG.imageHeight / 2;
    map.setView([cy, cx], 0);

    return map;
  }

  // --- Build Graph từ POIs ---
  function buildGraph(pois) {
    const g = {};

    pois.forEach(node => {
      if (!g[node.id]) {
        g[node.id] = { id: node.id, label: node.label, x: node.x, y: node.y, floor: node.floor, edges: [] };
      }
      (node.links || []).forEach(link => {
        g[node.id].edges.push({ to: link.to, weight: link.weight });
        // đảm bảo node đích tồn tại trong graph
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

    // Tự nối custom/gps node với node gần nhất cùng tầng (để luôn có đường đi)
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
        const weight = Math.max(1, Math.round(best / 10));
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
  function aStar(graph, startId, endId) {
    const openSet = new Set([startId]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    Object.keys(graph).forEach(id => {
      gScore[id] = Infinity;
      fScore[id] = Infinity;
    });
    gScore[startId] = 0;

    // Heuristic: Euclidean distance
    function heuristic(a, b) {
      const dx = graph[a].x - graph[b].x;
      const dy = graph[a].y - graph[b].y;
      const floorDiff = Math.abs(graph[a].floor - graph[b].floor) * 50; // phạt đổi tầng
      return Math.sqrt(dx * dx + dy * dy) + floorDiff;
    }

    fScore[startId] = heuristic(startId, endId);

    while (openSet.size > 0) {
      // Tìm node có fScore thấp nhất
      let current = null;
      let currentF = Infinity;
      openSet.forEach(id => {
        if (fScore[id] < currentF) {
          currentF = fScore[id];
          current = id;
        }
      });

      if (current === endId) {
        // Truy vết đường đi
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

  // --- Floor Layers ---
  function createFloorLayers(map) {
    const bounds = [[0, 0], [CONFIG.imageHeight, CONFIG.imageWidth]];

    for (let f = 1; f <= 3; f++) {
      const imgUrl = CONFIG.images[f];

      const overlay = L.imageOverlay(imgUrl, bounds, {
        opacity: 1,
        interactive: true,
      });

      floorLayers[f] = overlay;
    }

    // Mặc định hiện tầng 1
    currentFloorLayer = floorLayers[1];
    currentFloorLayer.addTo(map);
  }

  // --- Create Placeholder overlays (khi chưa có ảnh) ---
  function createPlaceholderLayers(map) {
    const bounds = [[0, 0], [CONFIG.imageHeight, CONFIG.imageWidth]];
    const colors = {
      1: { bg: '#ffe0cc', border: '#ff6b35', label: 'Tầng 1' },
      2: { bg: '#cce5ff', border: '#0066cc', label: 'Tầng 2' },
      3: { bg: '#d4edda', border: '#28a745', label: 'Tầng 3' },
    };

    for (let f = 1; f <= 3; f++) {
      const color = colors[f];

      // Dùng rectangle thay vì image overlay khi chưa có ảnh
      const rect = L.rectangle(bounds, {
        color: color.border,
        weight: 2,
        fillColor: color.bg,
        fillOpacity: 0.3,
      });

      // Text label ở giữa bản đồ
      const centerLat = CONFIG.imageHeight / 2;
      const centerLng = CONFIG.imageWidth / 2;

      const icon = L.divIcon({
        className: 'placeholder-label',
        html: `
          <div style="
            background: rgba(255,255,255,0.9);
            padding: 16px 24px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            border: 2px dashed ${color.border};
          ">
            <div style="font-size: 18px; font-weight: 700; color: ${color.border};">
              🗺️ ${color.label}
            </div>
            <div style="font-size: 13px; color: #666; margin-top: 6px;">
              Đặt ảnh tại <code>assets/floor-${f}.png</code>
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">
              ${CONFIG.imageWidth} × ${CONFIG.imageHeight} px
            </div>
          </div>
        `,
        iconSize: [300, 120],
        iconAnchor: [150, 60],
      });

      const label = L.marker([centerLat, centerLng], { icon });
      floorLayers[f] = { rect, label };
    }

    currentFloorLayer = floorLayers[1];
    currentFloorLayer.rect.addTo(map);
    currentFloorLayer.label.addTo(map);
  }

  // --- Switch floor ---
  function switchFloor(floorNum) {
    if (floorNum === currentFloor) return;

    // Ẩn floor cũ
    const old = floorLayers[currentFloor];
    if (old.rect) {
      map.removeLayer(old.rect);
      map.removeLayer(old.label);
    } else {
      map.removeLayer(old);
    }

    // Ẩn markers của floor cũ
    if (markerLayers[currentFloor]) {
      markerLayers[currentFloor].forEach(m => map.removeLayer(m));
    }

    // Ẩn path nếu đang hiện
    if (currentPathLayer) {
      map.removeLayer(currentPathLayer);
      currentPathLayer = null;
    }

    // Hiện floor mới
    currentFloor = floorNum;
    const next = floorLayers[floorNum];
    if (next.rect) {
      next.rect.addTo(map);
      next.label.addTo(map);
    } else {
      next.addTo(map);
    }

    // Hiện markers của floor mới
    if (markerLayers[floorNum]) {
      markerLayers[floorNum].forEach(m => m.addTo(map));
    }

    if (gpsMarker && gpsNode) {
      if (gpsNode.floor === currentFloor) {
        gpsMarker.addTo(map);
      } else {
        map.removeLayer(gpsMarker);
      }
    }

    // Vẽ lại path nếu cần
    if (currentPath) {
      drawPath(currentPath);
    }

    // Cập nhật tabs
    document.querySelectorAll('.floor-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.floor) === floorNum);
    });
  }

  // --- Marker data store (để có thể kéo/xóa marker riêng lẻ) ---
  const markerRefs = {}; // nodeId -> { marker, node }

  // --- Create Marker for a POI ---
  function createPOIMarker(node, map) {
    if (node.id === 'gps') return null;
    const color = node.floor === 1 ? '#ff6b35'
               : node.floor === 2 ? '#0066cc'
               : '#28a745';

    const isCustom = node.id.startsWith('custom-');

    const icon = L.divIcon({
      className: 'poi-marker',
      html: `
        <div class="poi-pill${isCustom ? ' is-custom' : ''}" style="--poi-color: ${color};">
          ${node.label}
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const marker = L.marker([node.y, node.x], {
      icon,
      draggable: isCustom, // chỉ custom node mới kéo được
    });

    marker.nodeId = node.id;
    marker._poiData = node;
    marker._isCustom = isCustom;

    // Click để chọn vào dropdown
    marker.on('click', () => {
      const fromSelect = document.getElementById('from-select');
      const toSelect = document.getElementById('to-select');

      if (gpsMode) {
        toSelect.value = node.id;
        if (fromSelect.value && toSelect.value) {
          findRoute();
        }
        return;
      }

      if (!fromSelect.value) {
        fromSelect.value = node.id;
      } else if (!toSelect.value || toSelect.value === node.id) {
        toSelect.value = node.id;
      } else {
        fromSelect.value = node.id;
        toSelect.value = '';
      }

      if (fromSelect.value && toSelect.value) {
        findRoute();
      }
    });

    // Right-click để xoá (chỉ custom node)
    if (isCustom) {
      marker.on('contextmenu', (e) => {
        L.DomEvent.stopPropagation(e);
        if (confirm(`Xoá "${node.label}" khỏi bản đồ?`)) {
          deleteCustomNode(node.id);
        }
      });

      // Kéo thả để điều chỉnh vị trí
      marker.on('dragend', (e) => {
        const pos = marker.getLatLng();
        const customNode = customNodes.find(n => n.id === node.id);
        if (customNode) {
          customNode.x = Math.round(pos.lng);
          customNode.y = Math.round(pos.lat);
          marker._poiData = customNode;
          saveCustomNodes();
        }
      });
    }

    // Lưu ref
    markerRefs[node.id] = { marker, node };

    return marker;
  }

  // --- Place all POI markers ---
  function placeMarkers(map) {
    const allNodes = getAllNodes();

    allNodes.forEach(node => {
      if (node.id === 'gps') return;
      if (!markerLayers[node.floor]) markerLayers[node.floor] = [];
      const marker = createPOIMarker(node, map);
      if (!marker) return;
      markerLayers[node.floor].push(marker);

      // Chỉ add nếu là floor hiện tại
      if (node.floor === currentFloor) {
        marker.addTo(map);
      }
    });
  }

  // --- Populate dropdowns ---
  function populateDropdowns() {
    const fromSelect = document.getElementById('from-select');
    const toSelect = document.getElementById('to-select');
    const allNodes = getAllNodes();

    fromSelect.innerHTML = '<option value="">— Chọn điểm đi —</option>';
    toSelect.innerHTML = '<option value="">— Chọn điểm đến —</option>';

    if (gpsNode) {
      const gpsOpt = document.createElement('option');
      gpsOpt.value = 'gps';
      gpsOpt.textContent = '📡 Vị trí hiện tại';
      fromSelect.appendChild(gpsOpt);
    }

    allNodes.forEach(node => {
      if (node.id === 'gps') return;
      const opt1 = document.createElement('option');
      opt1.value = node.id;
      opt1.textContent = `[T${node.floor}] ${node.label}`;
      fromSelect.appendChild(opt1);

      if (node.id === 'gps') return;
      const opt2 = document.createElement('option');
      opt2.value = node.id;
      opt2.textContent = `[T${node.floor}] ${node.label}`;
      toSelect.appendChild(opt2);
    });

    if (gpsMode && gpsNode) {
      fromSelect.value = 'gps';
      fromSelect.disabled = true;
    }
  }

  // --- Get all nodes (mẫu + custom) ---
  function getAllNodes() {
    const combined = [...SAMPLE_POIS];
    customNodes.forEach(n => {
      // Chỉ thêm nếu chưa tồn tại
      if (!combined.find(c => c.id === n.id)) {
        combined.push(n);
      }
    });
    if (gpsNode) {
      combined.push(gpsNode);
    }
    return combined;
  }

  // --- Find and draw route ---
  function findRoute() {
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
        '<p style="color: #d32f2f;">❌ Không tìm thấy đường đi giữa hai điểm này.</p>';
      document.getElementById('route-info').classList.remove('hidden');
      return;
    }

    currentPath = path;
    drawPath(path);

    // Hiển thị thông tin
    showRouteInfo(path, g);
  }

  // --- Draw path on map ---
  function drawPath(path) {
    // Xoá path cũ
    if (currentPathLayer) {
      map.removeLayer(currentPathLayer);
      currentPathLayer = null;
    }

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
      if (seg.a.floor === currentFloor && seg.b.floor === currentFloor) {
        latlngs.push([seg.a.y, seg.a.x]);
        latlngs.push([seg.b.y, seg.b.x]);
      }
    }

    if (latlngs.length > 0) {
      currentPathLayer = L.polyline(latlngs, {
        color: '#ff6b35',
        weight: 5,
        opacity: 0.85,
        dashArray: '10, 6',
      }).addTo(map);

      // Fit bounds vào path
      map.fitBounds(currentPathLayer.getBounds().pad(0.2));
    } else {
      // Path nằm ở tầng khác — thông báo
      currentPathLayer = null;
    }
  }

  // --- Show route info ---
  function showRouteInfo(path, graph) {
    const allNodes = getAllNodes();
    const nodeMap = {};
    allNodes.forEach(n => { nodeMap[n.id] = n; });

    let totalWeight = 0;
    let html = '<div class="stat"><span>Tổng quãng đường:</span><span><strong>';

    for (let i = 0; i < path.length - 1; i++) {
      const edge = graph[path[i]]?.edges.find(e => e.to === path[i + 1]);
      if (edge) totalWeight += edge.weight;
    }

    const timeMin = Math.round(totalWeight / 80); // 80m/phút tốc độ trung bình
    html += `${totalWeight} m</strong></span></div>`;
    html += `<div class="stat"><span>⏱️ Thời gian:</span><span><strong>~${timeMin} phút</strong></span></div>`;
    html += '<hr style="border: none; border-top: 1px dashed #ccc; margin: 8px 0;">';
    html += '<div style="font-weight: 600; margin-bottom: 6px;">📍 Các bước:</div>';

    path.forEach((id, idx) => {
      const node = nodeMap[id];
      if (!node) return;
      const prefix = idx === 0 ? '🟢 Xuất phát' : idx === path.length - 1 ? '🔴 Điểm đến' : `➡️ Bước ${idx}`;
      html += `<div class="step">${prefix}: <strong>${node.label}</strong> <span style="color:#888;font-size:11px;">[T${node.floor}]</span></div>`;
    });

    document.getElementById('route-details').innerHTML = html;
    document.getElementById('route-info').classList.remove('hidden');
  }

  // --- Clear route ---
  function clearRoute() {
    if (currentPathLayer) {
      map.removeLayer(currentPathLayer);
      currentPathLayer = null;
    }
    currentPath = null;
    if (gpsMode && gpsNode) {
      document.getElementById('from-select').value = 'gps';
    } else {
      document.getElementById('from-select').value = '';
    }
    document.getElementById('to-select').value = '';
    document.getElementById('route-info').classList.add('hidden');
  }

  // --- Add custom node (click on map in edit mode) ---
  function addCustomNode(e) {
    if (gpsMode) {
      setGpsLocation(e.latlng);
      return;
    }
    if (!editMode) return;

    const latlng = e.latlng;
    const y = Math.round(latlng.lat);
    const x = Math.round(latlng.lng);

    const id = `custom-${Date.now()}`;
    const label = prompt('🏷️ Nhập tên địa điểm:', `Điểm mới #${customNodes.length + 1}`);
    if (!label) return;

    const newNode = {
      id,
      label: `📍 ${label}`,
      x,
      y,
      floor: currentFloor,
      links: [],
    };

    customNodes.push(newNode);
    saveCustomNodes();

    // Rebuild graph, repopulate markers
    refreshMarkers();
    populateDropdowns();
    renderCustomPointsList();

    // Chọn node mới trong dropdown để dễ dùng
    document.getElementById('from-select').value = id;
  }

  // --- Xoá custom node ---
  function deleteCustomNode(nodeId) {
    // Xoá marker khỏi bản đồ
    const ref = markerRefs[nodeId];
    if (ref && ref.marker) {
      map.removeLayer(ref.marker);
    }

    // Xoá khỏi markerLayers tracking
    Object.keys(markerLayers).forEach(f => {
      markerLayers[f] = markerLayers[f].filter(m => m.nodeId !== nodeId);
    });

    // Xoá khỏi customNodes array
    customNodes = customNodes.filter(n => n.id !== nodeId);

    // Xoá khỏi markerRefs
    delete markerRefs[nodeId];

    saveCustomNodes();
    populateDropdowns();
    renderCustomPointsList();

    // Xoá path nếu đang chọn node này
    const fromSelect = document.getElementById('from-select');
    const toSelect = document.getElementById('to-select');
    if (fromSelect.value === nodeId || toSelect.value === nodeId) {
      clearRoute();
    }
  }

  // --- Lưu custom nodes vào localStorage ---
  function saveCustomNodes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customNodes));
    } catch(e) {
      console.warn('Không thể lưu localStorage:', e);
    }
  }

  // --- Load custom nodes từ localStorage ---
  function loadCustomNodes() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customNodes = parsed;
          console.log(`📦 Đã khôi phục ${customNodes.length} điểm từ localStorage`);
        }
      }
    } catch(e) {
      console.warn('Không thể load localStorage:', e);
    }
  }

  // --- Hiển thị danh sách điểm tự đánh dấu ---
  function renderCustomPointsList() {
    const container = document.getElementById('custom-points-list');
    if (!container) return;

    if (customNodes.length === 0) {
      container.innerHTML = '<p class="hint">Chưa có điểm tự đánh dấu.</p>';
      const clearBtn = document.getElementById('clear-all-points-btn');
      if (clearBtn) clearBtn.style.display = 'none';
      const exportBtn = document.getElementById('export-coords-btn');
      if (exportBtn) exportBtn.style.display = 'none';
      const textarea = document.getElementById('export-textarea');
      if (textarea) textarea.style.display = 'none';
      return;
    }

    let html = '';
    customNodes.forEach((node, idx) => {
      const color = node.floor === 1 ? '#ff6b35'
                  : node.floor === 2 ? '#0066cc'
                  : '#28a745';
      html += `
        <div class="custom-point-item">
          <span class="custom-point-index" style="--poi-color: ${color};">${idx + 1}</span>
          <span class="custom-point-name">
            ${node.label} <span class="muted">[T${node.floor}]</span>
          </span>
          <button class="icon-button" onclick="App.deleteCustomNode('${node.id}')" title="Xoá">✕</button>
        </div>
      `;
    });
    container.innerHTML = html;

    // Hiện nút Xoá tất cả
    const clearBtn = document.getElementById('clear-all-points-btn');
    if (clearBtn) clearBtn.style.display = 'block';

    // Hiện nút xuất tọa độ
    const exportBtn = document.getElementById('export-coords-btn');
    if (exportBtn) exportBtn.style.display = 'block';
  }

  function createGpsMarker(node) {
    const icon = L.divIcon({
      className: 'gps-marker',
      html: '<div class="gps-dot"></div>',
      iconSize: [0, 0],
      iconAnchor: [7, 7],
    });

    return L.marker([node.y, node.x], {
      icon,
      interactive: false,
    });
  }

  function updateGpsStatus() {
    const status = document.getElementById('gps-status');
    if (!status) return;
    if (!gpsNode) {
      status.classList.add('hidden');
      status.textContent = '';
      return;
    }
    status.textContent = `Vị trí: T${gpsNode.floor} • (${gpsNode.x}, ${gpsNode.y})`;
    status.classList.remove('hidden');
  }

  function setGpsLocation(latlng) {
    const x = Math.round(latlng.lng);
    const y = Math.round(latlng.lat);
    gpsNode = {
      id: 'gps',
      label: '📡 Vị trí hiện tại',
      x,
      y,
      floor: currentFloor,
      links: [],
    };

    if (!gpsMarker) {
      gpsMarker = createGpsMarker(gpsNode);
    }
    gpsMarker.setLatLng([gpsNode.y, gpsNode.x]);
    if (gpsMode && gpsNode.floor === currentFloor) {
      gpsMarker.addTo(map);
    }

    updateGpsStatus();
    populateDropdowns();

    const fromSelect = document.getElementById('from-select');
    if (fromSelect) {
      fromSelect.value = 'gps';
    }

    const toId = document.getElementById('to-select').value;
    if (toId) {
      findRoute();
    }
  }

  function setGpsMode(enabled) {
    gpsMode = enabled;
    const hint = document.getElementById('gps-mode-hint');
    if (hint) hint.classList.toggle('hidden', !gpsMode);

    const fromSelect = document.getElementById('from-select');
    if (fromSelect) {
      fromSelect.disabled = gpsMode;
    }

    if (!gpsMode) {
      if (gpsMarker) map.removeLayer(gpsMarker);
      gpsMarker = null;
      gpsNode = null;
      updateGpsStatus();
      populateDropdowns();
      if (fromSelect && fromSelect.value === 'gps') fromSelect.value = '';
      return;
    }

    if (!gpsNode) {
      setGpsLocation(map.getCenter());
    } else if (gpsNode.floor === currentFloor && gpsMarker) {
      gpsMarker.addTo(map);
    }
    if (fromSelect) {
      fromSelect.value = 'gps';
    }
  }

  // --- Xuất tọa độ dạng JSON để gửi trợ lý ---
  function exportCoords() {
    const points = customNodes.map((n, i) => ({
      id: `poi-${i + 1}`,
      label: n.label.replace('📍 ', ''),
      x: n.x,
      y: n.y,
      floor: n.floor,
    }));

    const code = JSON.stringify(points, null, 2);
    const textarea = document.getElementById('export-textarea');
    if (textarea) {
      textarea.value = code;
      textarea.style.display = 'block';
      textarea.select();
      try {
        navigator.clipboard.writeText(code);
        textarea.style.background = '#e8f5e9';
        setTimeout(() => { textarea.style.background = '#f5f1ec'; }, 2000);
      } catch(e) {}
    }
  }

  // --- Refresh all markers ---
  function refreshMarkers() {
    // Xoá markers cũ
    Object.keys(markerLayers).forEach(f => {
      markerLayers[f].forEach(m => map.removeLayer(m));
    });
    markerLayers = {};

    // Đặt lại
    placeMarkers(map);
  }

  // --- Mobile panel toggle ---
  function setupPanelToggle() {
    const toggle = document.getElementById('panel-toggle');
    const backdrop = document.getElementById('panel-backdrop');
    if (!toggle) return;

    const setOpen = (open) => {
      document.body.classList.toggle('panel-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    const media = window.matchMedia('(max-width: 900px)');
    const syncState = () => {
      setOpen(!media.matches);
    };

    syncState();
    if (media.addEventListener) {
      media.addEventListener('change', syncState);
    } else if (media.addListener) {
      media.addListener(syncState);
    }

    toggle.addEventListener('click', () => {
      setOpen(!document.body.classList.contains('panel-open'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => setOpen(false));
    }
  }

  // --- Service worker registration ---
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(() => {
          console.log('🧩 Service worker registered');
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    });
  }

  // --- Init map with placeholder or real images ---
  let map;

  function init() {
    map = initMap();

    // Kiểm tra ảnh có tồn tại không
    const hasImages = checkImagesExist();

    if (hasImages) {
      createFloorLayers(map);
    } else {
      createPlaceholderLayers(map);
    }

    // Khôi phục điểm đã lưu
    loadCustomNodes();

    // Đặt POI markers
    placeMarkers(map);
    populateDropdowns();
    renderCustomPointsList();
    setupPanelToggle();
    registerServiceWorker();

    // Floor switch events
    document.querySelectorAll('.floor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const floor = parseInt(btn.dataset.floor);
        switchFloor(floor);

        // Cập nhật tầng hiện tại trong header hint
        const floorName = CONFIG.floorNames[floor] || `Tầng ${floor}`;
      });
    });

    // Route buttons
    document.getElementById('find-route-btn').addEventListener('click', findRoute);
    document.getElementById('clear-route-btn').addEventListener('click', clearRoute);

    // Edit mode toggle
    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
      editMode = e.target.checked;
      document.getElementById('edit-mode-hint').classList.toggle('hidden', !editMode);
      map.dragging[editMode ? 'disable' : 'enable']();
    });

    // GPS mode toggle
    document.getElementById('gps-mode-toggle').addEventListener('change', (e) => {
      setGpsMode(e.target.checked);
    });

    // Click on map to add node
    map.on('click', addCustomNode);

    // Xoá tất cả custom nodes
    document.getElementById('clear-all-points-btn').addEventListener('click', () => {
      if (customNodes.length === 0) return;
      if (confirm(`Xoá tất cả ${customNodes.length} điểm đã đánh dấu?`)) {
        // Xoá từng marker khỏi bản đồ
        customNodes.forEach(n => {
          const ref = markerRefs[n.id];
          if (ref && ref.marker) map.removeLayer(ref.marker);
        });
        // Clear tracking
        Object.keys(markerLayers).forEach(f => {
          markerLayers[f] = markerLayers[f].filter(m => m.nodeId && !m.nodeId.startsWith('custom-'));
        });
        customNodes = [];
        Object.keys(markerRefs).forEach(k => {
          if (k.startsWith('custom-')) delete markerRefs[k];
        });
        saveCustomNodes();
        populateDropdowns();
        renderCustomPointsList();
        clearRoute();
      }
    });

    // Xuất tọa độ
    document.getElementById('export-coords-btn').addEventListener('click', exportCoords);

    // Tự động chọn khi click vào dropdown item
    document.getElementById('from-select').addEventListener('change', () => {
      const from = document.getElementById('from-select').value;
      const to = document.getElementById('to-select').value;
      if (from && to) findRoute();
    });

    document.getElementById('to-select').addEventListener('change', () => {
      const from = document.getElementById('from-select').value;
      const to = document.getElementById('to-select').value;
      if (from && to) findRoute();
    });

    console.log('✅ App ready! Current floor:', currentFloor);
    console.log('📌 Cách đánh tọa độ:');
    console.log('   1. Bật "Chế độ đánh dấu"');
    console.log('   2. Click vào bản đồ để thêm điểm');
    console.log('   3. Xem tọa độ trong console (F12)');
  }

  // --- Check if image files exist ---
  function checkImagesExist() {
    try {
      const url = CONFIG.images[1];
      const req = new XMLHttpRequest();
      req.open('HEAD', url, false); // synchronous HEAD request
      req.send();
      return req.status >= 200 && req.status < 400;
    } catch(e) {
      return false;
    }
  }

  // Khởi chạy khi page load xong
  document.addEventListener('DOMContentLoaded', init);

  // Public API cho console
  return {
    switchFloor,
    findRoute,
    clearRoute,
    addCustomNode,
    deleteCustomNode,
    exportCoords,
    refreshMarkers,
    renderCustomPointsList,
    getCurrentFloor: () => currentFloor,
    getCustomNodes: () => customNodes,
    getAllNodes,
  };
})();