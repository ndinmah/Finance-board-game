self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS requests (bypass WebSockets ws/wss, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(fetch(event.request));
});
