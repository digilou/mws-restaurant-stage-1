/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
  **/
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Database URL for restaurants.
   */
  static get RESTAURANTS_URL() {
    return `${this.DATABASE_URL}/restaurants`;
  }

  /**
   * Database URL for reviews.
   */
  static get REVIEWS_URL() {
    return `${this.DATABASE_URL}/reviews`;
  }

  /**
   * Async function that pings appropriate server to see if online.
   * Takes either RESTAURANTS_URL OR REVIEWS_URL as argument
   * Adapted from code by Laura Franklin,
   * per Nicole Freed's idea to ping the server.
   */
  static pingServer(server) {
    console.log(`pingServer server: ${server}`);
    const status = fetch(server).then(response => {
      if (response.ok) { return true; }
    }).catch(error => {
      console.log('Error while pinging server: ', error);
      return false;
    });
    return status;
  }

  /**
   * open cache
  **/
  static get openDb() {
    const dbPromise = idb.open('rr-db', 3, (upgradeDB) => {
      // create object store
      switch (upgradeDB.oldVersion) {
        case 0:
          // store restaurant info
          const restaurantStore = upgradeDB.createObjectStore('restaurants', {
            keyPath: 'id'
          });
          restaurantStore.createIndex('cuisine', 'cuisine_type');
          restaurantStore.createIndex('neighborhood', 'neighborhood');
        case 1:
          // store review info
          const reviewStore = upgradeDB.createObjectStore('reviews', {
            keyPath: 'id'
          });
          // create index by restaurant and date posted
          reviewStore.createIndex('restaurant', 'restaurant_id');
          // reviewStore.createIndex('by-date', 'date');
        case 2:
          // create store for reviews created offline
          upgradeDB.createObjectStore('reviewQueue', {
            autoIncrement: true
          });
      }
    });
    return dbPromise;
  }

  /**
   * Fetch and cache all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(`${this.RESTAURANTS_URL}`)
    .then(response => response.json())
    .then(restaurants => {
      this.openDb.then( db => {
        const restaurantStore = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
        restaurants.forEach( 
          restaurant => restaurantStore.put(restaurant)
        );
        callback(null, restaurants);
        return restaurantStore.complete;
      });
    })
    .catch((error) => {
      console.log(`Request failed: ${error}`);
      callback(error, null);
    });
  }

  /**
 * Fetch a restaurant by its ID.
 */
static fetchRestaurantById(id, callback) {
  // fetch all restaurants with proper error handling.
  this.fetchRestaurants( (error, restaurants) => {
    if (error) {
      callback(error, null);
    } else {
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) { // Got the restaurant
        callback(null, restaurant);
      } else { // Restaurant does not exist in the database
        callback('Restaurant does not exist', null);
      }
    }
  });
}

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    this.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: this.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  /**
   * Fetch reviews by restaurant ID
   */

  static fetchReviewsByRestaurantId() {
    if(this.pingServer(this.REVIEWS_URL)) {
      console.log("Server online.")
      this.fetchReviewsFromServer();
      console.log("Fetched from server.")
    } else {
      console.log("Server offline.")
      this.fetchReviewsFromDB(fillReviewsHTML);
      console.log("Fetched from cached data.")
    }
  }

  /**
   * Fetch reviews from server
   */

   static fetchReviewsFromServer() {
     // check network for reviews endpoint
    fetch(`${DBHelper.REVIEWS_URL}/?restaurant_id=${Number(getParameterByName('id'))}`)
    .then(response => {
      if (response.ok) return response.json()
    })
    .then(reviews => {
      // put those reviews into IDB
      this.openDb.then( db => {
        const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
        reviews.forEach( 
          review => reviewsStore.put(review)
        );
      // if(reviews && reviews.length > 0) callback(null, reviews);
      return reviewsStore.complete;
      })
      .then(fillReviewsHTML(reviews))
    })
   }

  /**
   * Fetch reviews from server
   */

  static fetchReviewsFromDB(reviews) {
    this.openDb.then(db => {
      // combine 'reviews' && 'reviewQueue' stores
      const reviewStore = db.transaction('reviews', 'readonly').objectStore('reviews'),
            queueStore = db.transaction('reviewQueue', 'readonly').objectStore('reviewQueue'),
            allReviews = Promise.all(reviewStore.getAll() + queueStore.getAll());

      if(reviews && reviews.length > 0) {
        reviewsStore.getAll()
        .then( review => {
          fillReviewsHTML(review)
        })
      }
      return reviewStore.complete;
    })
  }

  /**
   * Add to queue
   */
  static addReviewToQueue(reviews) {
    this.openDb.then(db => {
        const reviewStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
        // check if there is more than one review
        if (Array.isArray(reviews)) {
          reviews.forEach(review => {
            reviewStore.put(review)
            console.log('more reviews stored')
          })
        } else {
          // if only one...
          reviewStore.put(reviews)
          console.log('one review stored')
        }
        return reviewStore.complete;
    })
    .then(fillReviewsHTML(reviews))
    .then(console.log('You\'re offline. Reviews queued!'))
  }


  /*
  * Post pending reviews to network (after online)
  */
  static postFromReviewQueue() {
    this.openDb.then(db => {
      const queueStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
      queueStore.getAll()
      .then(offlineReviews => {
        if (Array.isArray(offlineReviews)) {
          offlineReviews.forEach(offlineReview => {
            this.postToServer(offlineReview);
          })
        } else {
          this.postToServer(offlineReview);
        }
      })
      .then(pushedReviews => {
        queueStore.clear(pushedReviews);
      })
    })
  }

  /*
  * Store server data into IDB
  */

  static storeInIDB() {
    // look at server reviews
    fetch(`${this.REVIEWS_URL}/?restaurant_id=${getParameterByName('id')}`)
    .then(response => response.json())
    .then(reviews => {
      this.openDb.then( db => {
        const reviewStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
        reviews.forEach(
          review => reviewStore.put(review)
        );
        return reviewStore.complete;
      });
    })
    .then(() => console.log('Reviews updated in IDB!'))
    .catch(err => console.log(err));
  }

  /*
  * Put object (data values) from form onto server.
  */

  static postToServer(data) {
    return fetch(this.REVIEWS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(data),
      credentials: 'same-origin',
      // mode: 'no-cors'
    })
    .then(response => {
      if(response.ok) return response.json()
    }) // parse response to JSON
    .then(this.storeInIDB(data)) // copy to IDB reviews store
    .then(location.reload(true)) // refresh page
    .catch(err => err);
  }

  /**
   * Update toggle state on server
   */

  static changeToggleStateOnServer(toggle) {
    fetch(`${this.RESTAURANTS_URL}/${getParameterByName('id')}/?is_favorite=${toggle}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(toggle),
      credentials: 'same-origin',
      mode: 'no-cors'
    })
    .then(response => {
      if(response.ok) return response.json()
    })
    .catch(err => err);
  }

}