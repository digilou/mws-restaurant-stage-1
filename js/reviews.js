const reviewForm = document.forms[0];

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

  // Post reviews on page
  fillReviewsHTML();

  // Ping server to check if online yet
  // If true, push queued Reviews to server and IDB reviews store
  if(DBHelper.pingServer(DBHelper.REVIEWS_URL) == true) postFromReviewQueue(reviewData);
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
  .then(createReviewHTML(reviews))
  .then(console.log('You\'re offline. Reviews queued!'))
}


/*
 * Post pending reviews to network (after online)
 */
function postFromReviewQueue() {
  DBHelper.openDb.then(db => {
    const queueStore = db.transaction('reviewQueue', 'readonly').objectStore('reviewQueue');
    return queueStore.getAll()
    .then(offlineReviews => {
      offlineReviews.forEach(offlineReview => {
        postToServer(offlineReview)
      })
    });
  })
}

/*
 * Store server data into IDB
 */

function storeInIDB() {
  // look at server reviews
  fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${self.restaurant.id}`)
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
  .catch(addReviewToQueue(data));
}

/*
 * Listen for submission of review form
 */

reviewForm.addEventListener('submit', addReview, false);


// 1) User presses Submit button on the form,
// 2) Call `addReview()` to gather the review data,
// 3) Call  `addReviewToQueue()` to add the review to the IDB `reviewQueue` store,
// 4) Display ALL reviews from both the `reviews` and `reviewQueue` object stores combined in the UI (call this at page load as well as here),
// 5) Run `pingServer()` in a `DOMContentLoaded` event listener in both `main.js` and `restaurant_info.js`, and finally,
// 6) Based on the results of `pingServer()`, if server is online (`if isOnline`), call `postFromReviewQueue()` to push the offline reviews to the server.