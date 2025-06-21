// Basic service worker placeholder
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Claim clients immediately so the service worker can control pages
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // For now, just pass through requests
  return;
});
