// Build, activate, fetch cache

const cacheName = 'reviews-cache-v1',
      filesToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/data/restaurants.json',
        '/img/',
        '/js/dbhelper.js',
        '/js/register.js',
        '/js/main.js',
        '/js/restaurant_info.js'
      ];

// first install cache of application shell
self.addEventListener('install', e => {
  console.log("Installing service worker...", e);
  e.waitUntil(
    caches.open(cacheName).
    then(cache => {
      return cache.addAll(filesToCache);
    }).then(() => {
      return self.skipWaiting();
    })
  )
});

// activate cache, remove outdated caches
self.addEventListener('activate', e => {
  console.log("Activating serive worker...", e);
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if(key !== cacheName) return caches.delete(key);
      }))
    })
  )
  return self.clients.claim();
});

// fetch cache, with network and generic fallbacks
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
    .then(response => {
      return response || fetch(e.request);
    })
    .catch(() => caches.match('/index.html'))
  )
});