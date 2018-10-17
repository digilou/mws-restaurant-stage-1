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
   * open cache
  **/
  static get IDB() {
    const dbPromise = idb.open('reviews-db', 2, (upgradeDB) => {
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
          reviewStore.createIndex('by-date', 'time');
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
    fetch(`${this.DATABASE_URL}/restaurants`)
    .then(response => response.json())
    .then(restaurants => {
      this.IDB
      .then( db => {
        const tx = db.transaction('restaurants', 'readwrite'),
              restaurantStore = tx.objectStore('restaurants');
        restaurants.forEach( restaurant => {
          restaurantStore.put(restaurant);
        });
        callback(null, restaurants);
        return tx.complete;
      });
    })
    .catch((error) => {
      console.log(`Request failed: ${error}`);
      callback(error, null);
    });
  }

  /**
   * Fetch all reviews by restaurant ID.
   */
  static fetchReviews(id, callback) {
    fetch(`${this.DATABASE_URL}/reviews/?restaurant_id=${id}`)
    .then(response => {
      if(response.ok) response.json()
    })
    .then(reviews => {
      this.IDB
      .then( db => {
        const tx = db.transaction('reviews', 'readwrite'),
              reviewStore = tx.objectStore('reviews');
        reviews.forEach( review => {
          reviewStore.put(review);
        });
        callback(null, reviews);
        return tx.complete;
      });
    })
    .catch((error) => {
      console.log(`Request failed: ${error}`);
      this.IDB
      .then(db => {
        const tx = db.transaction("reviews", "readonly");
        const store = tx.objectStore("reviews");
        reviewStore.getAll()
        .then(reviewsIDB => callback(null, reviewsIDB))
      })
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
   * Submit a review
   */
  static addReview(formData, callback) {
    // Attempt to POST review to server.
    this.postReview(formData)
    .then( () => {
      callback(null, 'Review successful!');
    })
    .catch(error => {
      // Fetch failed so add to queue to POST when online
      this.addToReviewQueue(formData, (err, res) => {
        if (error) {
          callback(err, null, true);
        } else {
          callback(res, null);
        }
      });
    });
  }

  /**
   * Add to queue
   */
  static addToReviewQueue(formData, callback) {
    this.IDB()
    .then(db => {
      const tx = db.transaction('reviewQueue', 'readwrite');
      tx.objectStore('reviewQueue')
        .put(formData)
        .then( () => {
          callback(null, `You might be offline. We'll post your review when you're back online.`);
        });
      return tx.complete;
    })
    .catch(error => {
      callback(`${error}. It appears you're offline. Please try again later.`, null);
    });
  }

  /**
   * POST review in readable format
   */
  static postReview(reviewData) {
    return fetch(`${this.DATABASE_URL}/reviews`, {
      body: JSON.stringify(reviewData),
      mode: 'cors',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  }

  /**
   * Attempt to post the pending reviews
   */
  static postNextReview(cursor) {
    if (!cursor) return;
    this.postReview(cursor.value);
    cursor.delete();
    return cursor.continue()
    .then(postNextReview);
  }

  static postFromReviewQueue(callback) {
    this.IDB()
    .then(db => {
      const tx = db.transaction('reviewQueue', 'readwrite'),
            store = tx.objectStore('reviewQueue');
      return store.openCursor();
    })
    .then(postNextReview)
    .then( () => {
      callback(null, 'Your review has been posted!');
    })
    .catch(error => {
      callback(error, null)
    });
  }
}
