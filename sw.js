// Build, activate, fetch cache

const cacheName = 'reviews-cache-v2',
      filesToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/data/restaurants.json',
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
        '/js/register.js',
        '/js/main.js',
        '/js/restaurant_info.js'
      ];

// first install cache of application shell
self.addEventListener('install', e => {
  console.log("Installing service worker...", e);
  e.waitUntil(
    caches.open(cacheName)
          .then(cache => {
            return cache.addAll(filesToCache);
          })
          .then(() => {
            return self.skipWaiting();
          })
          .catch(error => {
            console.log('Cache failed.', error);
          })
  )
});

// activate cache, remove outdated caches
self.addEventListener('activate', e => {
  console.log("Activating service worker...", e);
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.filter(key => {
          return key.startsWith('reviews-') && key != cacheName;
        }).map(keyList => {
          return caches.delete(keyList);
        })
    )})
  )
  return self.clients.claim();
});

// fetch cache, with network and generic fallbacks
self.addEventListener('fetch', e => {
  console.log("Fetching cache...")
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

// self.addEventListener('fetch', e => {
//   e.respondWith(
//     caches.match(e.request)
//     .then(response => {
//       if(response) {
//         console.log('Event request found.');
//         return response;
//       }
//       return fetch(event.request).then(networkResponse => {
//         if(networkResponse === 404) {
//           console.log('Network Response is: ', networkResponse.status);
//           return;
//         }
//         return caches.open(cacheName)
//           .then(cache => {
//             cache.put(event.request.url,  networkResponse.clone());
//             console.log('Cached.');
//             return networkResponse;
//           })
//       })
//     })
//     .catch(error => {
//       console.log("Error in the fetch event: ", error);
//       return;
//     })
//   )
// });