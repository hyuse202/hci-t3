/**
 * ui.js — Panel toggle, bottom sheet, mobile UI
 */

export function setupPanelToggle() {
  const toggle = document.getElementById('panel-toggle');
  const backdrop = document.getElementById('panel-backdrop');
  const panel = document.getElementById('side-panel');
  const grip = document.querySelector('.panel-grip');
  if (!toggle) return;

  const setOpen = (open) => {
    document.body.classList.toggle('panel-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

  const media = window.matchMedia('(max-width: 900px)');
  const syncState = () => {
    if (!media.matches) {
      setOpen(true);
    }
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

  // Tap on collapsed panel to expand (mobile)
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (!isMobile()) return;
      if (document.body.classList.contains('panel-open')) return;
      const tag = e.target.tagName;
      if (tag === 'SELECT' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'A' || tag === 'TEXTAREA') return;
      setOpen(true);
    });
  }

  // Drag to expand panel (mobile)
  let dragStartY = 0;
  let dragStartOpen = false;
  if (grip) {
    grip.addEventListener('touchstart', (e) => {
      if (!isMobile()) return;
      dragStartY = e.touches[0].clientY;
      dragStartOpen = document.body.classList.contains('panel-open');
    }, { passive: true });

    grip.addEventListener('touchmove', (e) => {
      if (!isMobile()) return;
      const dy = e.touches[0].clientY - dragStartY;
      if (Math.abs(dy) > 20) {
        if (dy < 0 && !dragStartOpen) {
          setOpen(true);
        } else if (dy > 0 && dragStartOpen) {
          setOpen(false);
        }
      }
    }, { passive: true });
  }
}

// Auto-open panel on mobile when route is found
export function autoOpenPanel() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    document.body.classList.add('panel-open');
    const toggle = document.getElementById('panel-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
}
