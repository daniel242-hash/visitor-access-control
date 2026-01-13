const CACHE_NAME = 'vac-resident-v1';
const urlsToCache = [
  '/',
  '/resident/dashboard',
  '/resident/contacts',
  '/resident/pre-register',
  '/resident/history',
  '/resident/settings',
  '/manifest.json',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  return self.clients.claim();
});

// Fetch event - Network First, falling back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests from being cached (always get fresh data)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If API fails and offline, return a custom offline response
        return new Response(
          JSON.stringify({
            success: false,
            message: 'You are currently offline. Please check your connection.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          }
        );
      })
    );
    return;
  }

  // For non-API requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          // Cache the new response for future use
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        })
      );
    }).catch(() => {
      // If both cache and network fail, return offline page
      if (event.request.destination === 'document') {
        return caches.match('/offline.html');
      }
    })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Visitor Access Control';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/resident/dashboard',
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/resident/dashboard')
    );
  }
});