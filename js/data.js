/**
 * data.js — Dữ liệu POI (Point of Interest) trong nhà ga T3
 *
 * Cấu trúc mỗi node:
 *   id: string duy nhất
 *   label: tên hiển thị
 *   x, y: tọa độ pixel trên ảnh
 *   floor: 1 | 2 | 3 (internal)
 *   links: mảng kết nối { to, weight (mét) }
 */

export const SAMPLE_POIS = [
  // ===== TẦNG 2 (internal floor 1) — Dữ liệu thật từ sơ đồ ga T3 =====
  {
    id: 'poi-1',
    label: 'Thang máy',
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
    label: 'Phòng hút thuốc',
    x: 122, y: 643,
    floor: 1,
    links: [
      { to: 'poi-1', weight: 6 },
      { to: 'poi-3', weight: 3 },
    ],
  },
  {
    id: 'poi-3',
    label: 'Thang cuốn',
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
    label: 'Nhà vệ sinh',
    x: 340, y: 728,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 7 },
      { to: 'poi-8', weight: 23 },
    ],
  },
  {
    id: 'poi-5',
    label: 'Thang cuốn',
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
    label: 'Thang cuốn',
    x: 370, y: 624,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 9 },
      { to: 'poi-7', weight: 4 },
    ],
  },
  {
    id: 'poi-7',
    label: 'Nhà vệ sinh',
    x: 333, y: 607,
    floor: 1,
    links: [
      { to: 'poi-5', weight: 8 },
      { to: 'poi-6', weight: 4 },
    ],
  },
  {
    id: 'poi-8',
    label: 'Thang máy',
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
    label: 'Thang cuốn',
    x: 560, y: 680,
    floor: 1,
    links: [
      { to: 'poi-8', weight: 3 },
      { to: 'poi-214', weight: 5 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-10',
    label: 'Phòng hút thuốc lá',
    x: 1844, y: 646,
    floor: 1,
    links: [
      { to: 'poi-11', weight: 5 },
    ],
  },
  {
    id: 'poi-11',
    label: 'Thang máy',
    x: 1863, y: 688,
    floor: 1,
    links: [
      { to: 'poi-10', weight: 5 },
      { to: 'poi-208', weight: 10 },  // liên tầng → T3 Techcombank
    ],
  },
  {
    id: 'poi-12',
    label: 'Cà phê, ăn nhanh giải khát',
    x: 1444, y: 441,
    floor: 1,
    links: [
      { to: 'poi-16', weight: 29 },
    ],
  },
  {
    id: 'poi-13',
    label: 'A1',
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
    label: 'A2',
    x: 743, y: 439,
    floor: 1,
    links: [
      { to: 'poi-13', weight: 8 },
      { to: 'poi-15', weight: 33 },
    ],
  },
  {
    id: 'poi-15',
    label: 'A3',
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
    label: 'A4',
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
    label: 'Băng chuyền trả hành lý',
    x: 672, y: 528,
    floor: 1,
    links: [
      { to: 'poi-13', weight: 9 },
      { to: 'poi-32', weight: 8 },
    ],
  },
  {
    id: 'poi-32',
    label: 'Băng chuyền trả hành lý',
    x: 750, y: 532,
    floor: 1,
    links: [
      { to: 'poi-31', weight: 8 },
      { to: 'poi-33', weight: 8 },
    ],
  },
  {
    id: 'poi-33',
    label: 'Băng chuyền trả hành lý',
    x: 828, y: 529,
    floor: 1,
    links: [
      { to: 'poi-32', weight: 8 },
      { to: 'poi-34', weight: 8 },
    ],
  },
  {
    id: 'poi-34',
    label: 'Băng chuyền trả hành lý',
    x: 908, y: 530,
    floor: 1,
    links: [
      { to: 'poi-33', weight: 8 },
      { to: 'poi-35', weight: 8 },
    ],
  },
  {
    id: 'poi-35',
    label: 'Băng chuyền trả hành lý',
    x: 990, y: 531,
    floor: 1,
    links: [
      { to: 'poi-34', weight: 8 },
      { to: 'poi-36', weight: 8 },
    ],
  },
  {
    id: 'poi-36',
    label: 'Băng chuyền trả hành lý',
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
    label: 'Băng chuyền trả hành lý',
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
    label: 'Băng chuyền trả hành lý',
    x: 1225, y: 529,
    floor: 1,
    links: [
      { to: 'poi-37', weight: 7 },
      { to: 'poi-39', weight: 8 },
    ],
  },
  {
    id: 'poi-39',
    label: 'Băng chuyền trả hành lý',
    x: 1306, y: 523,
    floor: 1,
    links: [
      { to: 'poi-38', weight: 8 },
    ],
  },
  {
    id: 'poi-41',
    label: 'Thang cuốn',
    x: 758, y: 644,
    floor: 1,
    links: [
      { to: 'poi-44', weight: 3 },
      { to: 'poi-48', weight: 6 },
    ],
  },
  {
    id: 'poi-42',
    label: 'Thang cuốn',
    x: 1277, y: 644,
    floor: 1,
    links: [
      { to: 'poi-47', weight: 5 },
      { to: 'poi-39', weight: 12 },
    ],
  },
  {
    id: 'poi-43',
    label: 'Thang cuốn',
    x: 1503, y: 643,
    floor: 1,
    links: [
      { to: 'poi-45', weight: 5 },
      { to: 'poi-49', weight: 6 },
    ],
  },
  {
    id: 'poi-44',
    label: 'Thang máy',
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
    label: 'Thang máy',
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
    label: 'Thang máy',
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
    label: 'Thang máy',
    x: 1311, y: 685,
    floor: 1,
    links: [
      { to: 'poi-42', weight: 5 },
      { to: 'poi-216', weight: 6 },  // liên tầng → T3 Thang máy
    ],
  },
  {
    id: 'poi-48',
    label: 'Nhà vệ sinh',
    x: 766, y: 706,
    floor: 1,
    links: [
      { to: 'poi-41', weight: 6 },
      { to: 'poi-44', weight: 7 },
    ],
  },
  {
    id: 'poi-49',
    label: 'Nhà vệ sinh',
    x: 1503, y: 706,
    floor: 1,
    links: [
      { to: 'poi-43', weight: 6 },
      { to: 'poi-50', weight: 10 },
    ],
  },
  {
    id: 'poi-50',
    label: 'Nhà vệ sinh',
    x: 1602, y: 676,
    floor: 1,
    links: [
      { to: 'poi-46', weight: 6 },
      { to: 'poi-49', weight: 10 },
    ],
  },
  {
    id: 'poi-51',
    label: 'Nhà vệ sinh',
    x: 1351, y: 450,
    floor: 1,
    links: [
      { to: 'poi-12', weight: 9 },
      { to: 'poi-52', weight: 11 },
    ],
  },
  {
    id: 'poi-52',
    label: 'Thang máy',
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
    label: 'Nhà vệ sinh',
    x: 541, y: 613,
    floor: 1,
    links: [
      { to: 'poi-9', weight: 7 },
      { to: 'poi-8', weight: 10 },
    ],
  },

  // ===== TẦNG 3 (internal floor 2) — Dữ liệu thật từ sơ đồ ga T3 =====
  // --- Gate (cửa khởi hành) ---
  {
    id: 'poi-101',
    label: 'Gate 10',
    x: 594, y: 846,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 17 },
      { to: 'poi-119', weight: 24 },
    ],
  },
  {
    id: 'poi-102',
    label: 'Gate 11',
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
    label: 'Gate 13',
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
    label: 'Gate 12',
    x: 918, y: 841,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 15 },
      { to: 'poi-103', weight: 17 },
    ],
  },
  {
    id: 'poi-105',
    label: 'Gate 14',
    x: 1280, y: 847,
    floor: 2,
    links: [
      { to: 'poi-103', weight: 20 },
      { to: 'poi-106', weight: 16 },
    ],
  },
  {
    id: 'poi-106',
    label: 'Gate 15',
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
    label: 'D1',
    x: 493, y: 525,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 15 },
      { to: 'poi-114', weight: 9 },
    ],
  },
  {
    id: 'poi-108',
    label: 'D2',
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
    label: 'D3',
    x: 697, y: 515,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 6 },
    ],
  },
  {
    id: 'poi-110',
    label: 'D4',
    x: 1056, y: 520,
    floor: 2,
    links: [
      { to: 'poi-111', weight: 5 },
      { to: 'poi-117', weight: 12 },
    ],
  },
  {
    id: 'poi-111',
    label: 'D5',
    x: 1105, y: 520,
    floor: 2,
    links: [
      { to: 'poi-110', weight: 5 },
      { to: 'poi-112', weight: 18 },
    ],
  },
  {
    id: 'poi-112',
    label: 'D6',
    x: 1288, y: 519,
    floor: 2,
    links: [
      { to: 'poi-111', weight: 18 },
      { to: 'poi-113', weight: 5 },
    ],
  },
  {
    id: 'poi-113',
    label: 'D7',
    x: 1340, y: 520,
    floor: 2,
    links: [
      { to: 'poi-112', weight: 5 },
    ],
  },
  // --- Thang cuốn ---
  {
    id: 'poi-114',
    label: 'Thang cuốn',
    x: 406, y: 521,
    floor: 2,
    links: [
      { to: 'poi-107', weight: 9 },
      { to: 'poi-115', weight: 13 },
      { to: 'poi-213', weight: 5 },
    ],
  },
  {
    id: 'poi-115',
    label: 'Thang cuốn',
    x: 540, y: 517,
    floor: 2,
    links: [
      { to: 'poi-114', weight: 13 },
      { to: 'poi-108', weight: 10 },
      { to: 'poi-9', weight: 5 },
      { to: 'poi-214', weight: 5 },
    ],
  },
  {
    id: 'poi-116',
    label: 'Thang cuốn',
    x: 795, y: 518,
    floor: 2,
    links: [
      { to: 'poi-108', weight: 15 },
      { to: 'poi-117', weight: 14 },
      { to: 'poi-44', weight: 5 },
      { to: 'poi-214', weight: 5 },
    ],
  },
  {
    id: 'poi-117',
    label: 'Thang cuốn',
    x: 946, y: 518,
    floor: 2,
    links: [
      { to: 'poi-116', weight: 14 },
      { to: 'poi-44', weight: 5 },
      { to: 'poi-214', weight: 5 },
    ],
  },
  {
    id: 'poi-118',
    label: 'Thang cuốn',
    x: 1134, y: 824,
    floor: 2,
    links: [
      { to: 'poi-103', weight: 7 },
      { to: 'poi-123', weight: 5 },
      { to: 'poi-215', weight: 5 },
    ],
  },
  {
    id: 'poi-119',
    label: 'Thang cuốn',
    x: 354, y: 849,
    floor: 2,
    links: [
      { to: 'poi-101', weight: 24 },
      { to: 'poi-121', weight: 10 },
    ],
  },
  {
    id: 'poi-120',
    label: 'Thang cuốn',
    x: 494, y: 778,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 17 },
      { to: 'poi-130', weight: 15 },
    ],
  },
  {
    id: 'poi-121',
    label: 'Thang cuốn',
    x: 326, y: 752,
    floor: 2,
    links: [
      { to: 'poi-119', weight: 10 },
      { to: 'poi-120', weight: 17 },
      { to: 'poi-130', weight: 3 },
      { to: 'poi-126', weight: 12 },
      { to: 'poi-213', weight: 5 },
    ],
  },
  {
    id: 'poi-122',
    label: 'Thang cuốn',
    x: 727, y: 742,
    floor: 2,
    links: [
      { to: 'poi-102', weight: 10 },
      { to: 'poi-120', weight: 24 },
      { to: 'poi-116', weight: 23 },
      { to: 'poi-44', weight: 5 },
    ],
  },
  {
    id: 'poi-123',
    label: 'Thang cuốn',
    x: 1124, y: 870,
    floor: 2,
    links: [
      { to: 'poi-118', weight: 5 },
      { to: 'poi-127', weight: 17 },
      { to: 'poi-215', weight: 5 },
    ],
  },
  {
    id: 'poi-124',
    label: 'Thang cuốn',
    x: 1491, y: 851,
    floor: 2,
    links: [
      { to: 'poi-106', weight: 5 },
      { to: 'poi-125', weight: 8 },
    ],
  },
  {
    id: 'poi-125',
    label: 'Thang cuốn',
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
    label: 'Thủ tục hàng không',
    x: 429, y: 694,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 12 },
      { to: 'poi-130', weight: 11 },
    ],
  },
  {
    id: 'poi-127',
    label: 'Thủ tục hàng không',
    x: 1077, y: 701,
    floor: 2,
    links: [
      { to: 'poi-123', weight: 17 },
      { to: 'poi-128', weight: 22 },
    ],
  },
  {
    id: 'poi-128',
    label: 'Thủ tục hàng không',
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
    label: 'Thang máy',
    x: 56, y: 824,
    floor: 2,
    links: [
      { to: 'poi-131', weight: 6 },
      { to: 'poi-209', weight: 10 },
    ],
  },
  {
    id: 'poi-130',
    label: 'Thang máy',
    x: 349, y: 777,
    floor: 2,
    links: [
      { to: 'poi-121', weight: 3 },
      { to: 'poi-120', weight: 15 },
      { to: 'poi-126', weight: 11 },
      { to: 'poi-213', weight: 5 },
    ],
  },
  {
    id: 'poi-131',
    label: 'Thang cuốn',
    x: 79, y: 770,
    floor: 2,
    links: [
      { to: 'poi-129', weight: 6 },
      { to: 'poi-209', weight: 10 },
    ],
  },
  {
    id: 'poi-132',
    label: 'Nhà vệ sinh',
    x: 1517, y: 738,
    floor: 2,
    links: [
      { to: 'poi-125', weight: 4 },
    ],
  },
  {
    id: 'poi-133',
    label: 'Thang cuốn',
    x: 1843, y: 771,
    floor: 2,
    links: [
      { to: 'poi-10', weight: 8 },
      { to: 'poi-208', weight: 10 },
    ],
  },

  // ===== TẦNG 4 (internal floor 3) — Dữ liệu thật từ sơ đồ ga T3 =====
  {
    id: 'poi-201',
    label: 'Phòng khách The Sens',
    x: 178, y: 658,
    floor: 3,
    links: [
      { to: 'poi-202', weight: 30 },
      { to: 'poi-209', weight: 16 },
    ],
  },
  {
    id: 'poi-202',
    label: 'Phòng khách Bông Sen',
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
    label: 'Phòng khách SH Airport Lounge',
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
    label: 'Phòng khách Bông Sen',
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
    label: 'Phòng khách thương gia Nam A Bank',
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
    label: 'VIP A - ACV Cảng HKQT Tân Sơn Nhất',
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
    label: 'Phòng khách Vietcombank',
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
    label: 'Phòng khách Techcombank',
    x: 1844, y: 653,
    floor: 3,
    links: [
      { to: 'poi-207', weight: 15 },
    ],
  },
  {
    id: 'poi-209',
    label: 'Thang bộ',
    x: 326, y: 705,
    floor: 3,
    links: [
      { to: 'poi-201', weight: 16 },
      { to: 'poi-213', weight: 6 },
    ],
  },
  {
    id: 'poi-210',
    label: 'Thang bộ',
    x: 708, y: 725,
    floor: 3,
    links: [
      { to: 'poi-214', weight: 4 },
      { to: 'poi-203', weight: 17 },
    ],
  },
  {
    id: 'poi-211',
    label: 'Thang bộ',
    x: 1133, y: 800,
    floor: 3,
    links: [
      { to: 'poi-215', weight: 6 },
      { to: 'poi-204', weight: 15 },
    ],
  },
  {
    id: 'poi-212',
    label: 'Thang bộ',
    x: 1276, y: 715,
    floor: 3,
    links: [
      { to: 'poi-216', weight: 9 },
      { to: 'poi-205', weight: 8 },
    ],
  },
  {
    id: 'poi-213',
    label: 'Thang máy',
    x: 381, y: 713,
    floor: 3,
    links: [
      { to: 'poi-202', weight: 11 },
      { to: 'poi-209', weight: 6 },
    ],
  },
  {
    id: 'poi-214',
    label: 'Thang máy',
    x: 666, y: 714,
    floor: 3,
    links: [
      { to: 'poi-203', weight: 20 },
      { to: 'poi-210', weight: 4 },
    ],
  },
  {
    id: 'poi-215',
    label: 'Thang máy',
    x: 1197, y: 807,
    floor: 3,
    links: [
      { to: 'poi-211', weight: 6 },
      { to: 'poi-204', weight: 18 },
    ],
  },
  {
    id: 'poi-216',
    label: 'Thang máy',
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
    label: 'Thang máy',
    x: 1587, y: 704,
    floor: 3,
    links: [
      { to: 'poi-207', weight: 13 },
      { to: 'poi-218', weight: 10 },
    ],
  },
  {
    id: 'poi-218',
    label: 'Thang bộ',
    x: 1501, y: 661,
    floor: 3,
    links: [
      { to: 'poi-206', weight: 10 },
      { to: 'poi-217', weight: 10 },
    ],
  },
];

// --- Phân loại tìm kiếm ---
export const CATEGORY_KEYWORDS = {
  gate:      ['gate', 'cửa'],
  lounge:    ['phòng khách', 'vip', 'lounge', 'the sens', 'bông sen', 'sh airport', 'nam a bank', 'acv', 'vietcombank', 'techcombank'],
  wc:        ['nhà vệ sinh', 'wc', 'phòng vệ sinh'],
  elevator:  ['thang máy'],
  escalator: ['thang cuốn'],
  food:      ['cà phê', 'ăn nhanh', 'giải khát'],
  baggage:   ['băng chuyền', 'hành lý'],
  smoke:     ['hút thuốc', 'phòng hút'],
};
