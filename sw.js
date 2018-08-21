// Fetch, install, activate cache

const version = 'v4',
      staticCacheName = 'reviews-cache-' + version,
      filesToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/offline.html',
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

// fetch cache, with fallbacks
addEventListener('fetch', fetchEvent => {
  console.log("Fetching cache...", fetchEvent);
  const request = fetchEvent.request;
  fetchEvent.respondWith(
    caches.match(request)
          .then(response => {
            if(response) return response;
            return fetch(request)
            .then(networkResponse => {
              if(networkResponse === 404) return;
              return caches.open(staticCacheName)
                .then(cache => {
                  cache.put(request.url, networkResponse.clone());
                  return networkResponse;
                })
            })
            .catch( error => {
              console.log(error);
              // fallback page
              return caches.match('/offline.html');
            }); // fetch catch
          }) // end match
  ) // end respondWith
}); // end eventListener

// first install cache of application shell
addEventListener('install', installEvent => {
  console.log("Installing service worker...", installEvent);
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticCacheName)
    .then(staticCache => staticCache.addAll(filesToCache))
  ) // end waitUntil
}); // end eventListener

// activate cache, remove outdated caches
addEventListener('activate', activateEvent => {
  console.log("Activating service worker...", activateEvent);
  activateEvent.waitUntil(
    caches.keys()
    .then(cacheNames => {
      return Promise.all(
        cacheNames.map(
          cacheName => {
            if(cacheName !== staticCacheName) return caches.delete(cacheName);
          }
        ) // end map
      ) // end Promise.all
    }) // end keys
    .then(() => clients.claim()) // clear for open tabs
  ) // end waitUntil
}); // end eventListener
