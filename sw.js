// Build, activate, fetch cache

const cacheName = 'reviews-cache-v3',
      filesToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/img/1.jpg',
        '/img/2.jpg',
        '/img/3.jpg',
        '/img/4.jpg',
        '/img/5.jpg',
        '/img/6.jpg',
        '/img/7.jpg',
        '/img/8.jpg',
        '/img/9.jpg',
        '/img/10.jpg',
        '/js/dbhelper.js',
        '/js/idb.js',
        '/js/register.js',
        '/js/main.js',
        '/js/restaurant_info.js'
      ];

// first install cache of application shell
self.addEventListener('install', e => {
  console.log("Installing service worker...", e);
  e.waitUntil(
    caches.open(cacheName)
    .then(cache => cache.addAll(filesToCache))
    .then(() => self.skipWaiting())
  )
});

// activate cache, remove outdated caches
self.addEventListener('activate', e => {
  console.log("Activating service worker...", e);
  e.waitUntil(
    caches.keys()
    .then(keyList => {
      return Promise.all(
        keyList.map(
          key => {
            if(key !== cacheName) return caches.delete(key);
          }
        )
      )
    })
  )
  return self.clients.claim();
});

// fetch cache, with network and generic fallbacks
self.addEventListener('fetch', e => {
  console.log("Fetching cache...", e);
  e.respondWith(
    caches.match(e.request)
          .then(response => {
            if(response) return response;
            return fetch(e.request)
            .then(networkResponse => {
              if(networkResponse === 404) return;
              return caches.open(cacheName)
                .then(cache => {
                  cache.put(e.request.url, networkResponse.clone());
                  return networkResponse;
                })
            })
          })
          .catch(error => {
            console.log('Error in the fetch event: ', error);
            return;
          })
  )
});
