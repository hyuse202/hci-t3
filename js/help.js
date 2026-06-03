/**
 * help.js — Hướng dẫn sử dụng & Onboarding Carousel
 */

import { renderIcons } from './icons.js';

const HELP_SHOWN_KEY = 'hci-t3-help-shown';

export function setupHelpOverlay() {
  const overlay = document.getElementById('help-overlay');
  const toggleBtn = document.getElementById('help-toggle-btn');
  const closeBtn = document.getElementById('help-close-btn');
  const slides = document.querySelectorAll('.help-slide');
  const dots = document.querySelectorAll('.help-dots .dot');
  const prevBtn = document.getElementById('help-prev-btn');
  const nextBtn = document.getElementById('help-next-btn');
  const slidesContainer = document.getElementById('help-slides');

  if (!overlay) return;

  let currentIdx = 0;
  const totalSlides = slides.length;

  const showSlide = (idx) => {
    currentIdx = idx;
    
    // Cập nhật trạng thái hiển thị của các slide
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === idx);
    });

    // Cập nhật các chấm chỉ số trang
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });

    // Cập nhật nút điều hướng
    if (idx === 0) {
      prevBtn.style.visibility = 'hidden';
    } else {
      prevBtn.style.visibility = 'visible';
    }

    if (idx === totalSlides - 1) {
      nextBtn.textContent = 'Bắt đầu';
      nextBtn.style.backgroundColor = '#10b981'; // Màu xanh lá cây hoàn thành
      nextBtn.style.borderColor = '#10b981';
      nextBtn.style.color = '#ffffff';
    } else {
      nextBtn.textContent = 'Tiếp tục';
      nextBtn.style.backgroundColor = ''; // Trở về màu mặc định (đỏ Rausch)
      nextBtn.style.borderColor = '';
      nextBtn.style.color = '';
    }
  };

  const nextSlide = () => {
    if (currentIdx < totalSlides - 1) {
      showSlide(currentIdx + 1);
    } else {
      closeHelp();
    }
  };

  const prevSlide = () => {
    if (currentIdx > 0) {
      showSlide(currentIdx - 1);
    }
  };

  const openHelp = () => {
    overlay.classList.remove('hidden');
    showSlide(0);
    renderIcons(); // Vẽ Lucide icons trong modal
  };

  const closeHelp = () => {
    overlay.classList.add('hidden');
    localStorage.setItem(HELP_SHOWN_KEY, 'true');
  };

  // Đăng ký sự kiện
  if (toggleBtn) toggleBtn.addEventListener('click', openHelp);
  if (closeBtn) closeBtn.addEventListener('click', closeHelp);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Click vào chấm chấm chỉ số trang
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
    });
  });

  // Hỗ trợ thao tác vuốt (swipe) chuyển slide trên di động
  if (slidesContainer) {
    let touchStartX = 0;
    let touchEndX = 0;

    slidesContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    slidesContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
      const diff = touchStartX - touchEndX;
      const minSwipeDistance = 50; // khoảng cách vuốt tối thiểu
      if (diff > minSwipeDistance) {
        // Vuốt sang trái → Trang tiếp theo
        nextSlide();
      } else if (diff < -minSwipeDistance) {
        // Vuốt sang phải → Trang trước
        prevSlide();
      }
    };
  }

  // Tự động hiển thị khi người dùng truy cập lần đầu
  const hasShown = localStorage.getItem(HELP_SHOWN_KEY);
  if (!hasShown) {
    // Độ trễ ngắn để bản đồ tải xong mượt mà
    setTimeout(() => {
      openHelp();
    }, 1200);
  }
}
