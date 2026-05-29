/**
 * sw-register.js — Service worker registration
 */

export function registerServiceWorker() {
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
