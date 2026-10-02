/**
 * Active le mode hors ligne (service worker) quand l'appli est servie en http(s).
 * Rien à faire dans l'appli de bureau : tout y est déjà local.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* hors ligne indisponible : l'appli fonctionne quand même */
    });
  });
}
