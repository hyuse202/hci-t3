/**
 * config.js — Cấu hình chung của ứng dụng
 */

export const CONFIG = {
  // --- Kích thước ảnh (pixel) ---
  imageWidth:  1920,
  imageHeight: 1080,

  // --- Đường dẫn ảnh ---
  images: {
    1: 'assets/floor-1.png',   // Tầng 2
    2: 'assets/floor-2.png',   // Tầng 3
    3: 'assets/floor-3.png',   // Tầng 4
  },

  // --- Tên hiển thị ---
  floorNames: {
    1: 'Tầng 2 — Hành khách đến',
    2: 'Tầng 3 — Thương mại',
    3: 'Tầng 4 — Khởi hành',
  },
};

// Key localStorage
export const STORAGE_KEY = 'hci-t3-custom-nodes';
export const POI_POS_KEY = 'hci-t3-poi-positions';

// A* heuristic: pixels per meter
export const PX_PER_M = 10;

// Tốc độ đi bộ (mét/phút)
export const WALKING_SPEED = 80;

// Ngưỡng voucher (mét)
export const VOUCHER_THRESHOLD = 50;

// Internal floor (1-3) → displayed floor (2-4)
export function displayFloor(f) {
  return f + 1;
}
