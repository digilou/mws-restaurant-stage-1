let restaurant,
    map;

const reviewForm = document.forms[0],
      heart = document.getElementById('svg-heart');

document.addEventListener('DOMContentLoaded', () => {
  if(DBHelper.pingServer(DBHelper.REVIEWS_URL)) postFromReviewQueue
}, false);

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb(self.restaurant);
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
    DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
      if(!reviews) {
        console.error(error);
        return;
      }
      console.log("Fetched reviews: ", reviews.length)
      fillReviewsHTML(reviews);
      callback(null, reviews);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', restaurant.name);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container'),
        title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet. Be the first!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  if (Array.isArray(reviews)) {
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  } else {
    ul.appendChild(createReviewHTML(reviews));
  }
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li'),
        name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p'),
        created = new Date(review.createdAt),
        dateOptions = {
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour12: false
        };
  date.innerHTML = created.toLocaleString('en-US', dateOptions);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating} stars`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb'),
        li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};


/**
 * Grab input data, post to IDB, then post to server
**/

function addReview(event) {
  // Prevent default submission behavior
  event.preventDefault();

  // Grab the values from the form fields
  const userName = reviewForm['name'].value,
        userRating = document.querySelector('#review-radios input[type=radio]:checked').value,
        userComment = reviewForm.comments.value;

   // Construct them into a `review` object

  const reviewData = {
    restaurant_id: Number(getParameterByName('id')),
    name: userName,
    rating: Number(userRating),
    comments: userComment,
    createdAt: Number(new Date()),
    updatedAt: Number(new Date())
  }

  // POST the review to IDB reviewQueue store
  addReviewToQueue(reviewData);

  // Reset form
  reviewForm.reset();

}

/**
 * Add to queue
 */
function addReviewToQueue(reviews) {
  DBHelper.openDb.then(db => {
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
function postFromReviewQueue() {
  DBHelper.openDb.then(db => {
    const queueStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
    queueStore.getAll()
    .then(offlineReviews => {
      if (Array.isArray(offlineReviews)) {
        offlineReviews.forEach(offlineReview => {
          postToServer(offlineReview);
        })
      } else {
        postToServer(offlineReview);
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

function storeInIDB() {
  // look at server reviews
  fetch(`${DBHelper.REVIEWS_URL}/?restaurant_id=${self.restaurant.id}`)
  .then(response => response.json())
  .then(reviews => {
    DBHelper.openDb.then( db => {
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

function postToServer(data) {
  return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
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
  .then(() => storeInIDB(data)) // copy to IDB
  .then(location.reload(true)) // refresh page
  .catch(err => err);
}

/*
 * Listen for submission of review form
 */

reviewForm.addEventListener('submit', addReview, false);


/* 
 * Favorite Toggle
 */

function toggleFavorite() {
  const checkbox = document.getElementById('heart-toggle');
  checkbox.checked ? 
    heart.style.fill = 'red' : heart.style.fill = '#eee';
  checkbox.checked ? 
    DBHelper.changeToggleStateOnServer(true) : 
    DBHelper.changeToggleStateOnServer(false);
}

function checkFave() {
  fetch(`${DBHelper.RESTAURANTS_URL}`)
  .then(() => {
    self.restaurant.is_favorite == "true" ?
      heart.style.fill = 'red' : heart.style.fill = '#eee';
  })
}

heart.addEventListener('click', toggleFavorite);

addEventListener('load', checkFave, false);

// 1. Why is pingServer(status) returning false when online?
// 2. where to get postFromReviewQuueue to work
// 3. concatanate both IDB store arrays to post when offline
// 4. heart toggle sometimes gives error