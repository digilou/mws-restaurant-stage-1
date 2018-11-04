const reviewForm = document.forms[0];
/**
 * Grab input data, put in server & IDB, post to page
**/
function addReview(event) {
  // Prevent default submission behavior
  event.preventDefault();

  // Grab the values from the form fields
  // const reviewForm = document.querySelector('#review-form'),
  const userName = reviewForm['name'].value,
        // userName = document.querySelector('#name').value,
        userRating = document.querySelector('#review-radios input[type=radio]:checked').value,
        userComment = reviewForm.comments.value;
        // userComment = document.querySelector('#comments').value;

   // Construct them into a `review` object

  const reviewData = {
    restaurant_id: Number(getParameterByName('id')),
    name: userName,
    rating: Number(userRating),
    comments: userComment,
    createdAt: Number(new Date()),
    updatedAt: Number(new Date())
  }

  // POST the review to the server if online, which then puts in IDB
  // Otherwise, post to reviews queue if offline, then post to server when online
  postToServer(reviewData);

}


// 4. Post review on page (even when offline) & refresh page
// createReviewHTML()
// 7. Clear reviewQueue data


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

function storeInIDB(serverData) {
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

/*
 * Listen for online || offline status
 */

addEventListener('online', () => {
  postFromReviewQueue();
  DBHelper.openDb.then(db => {
    const queueStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
    queueStore.clear()
  });
  console.log("Back online!");
}, false);

addEventListener('offline', () => {
  console.log("You're offline!")
})