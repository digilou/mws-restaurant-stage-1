/**
 * Grab input data, put in server & IDB, post to page
**/
function addReview(event) {
  // Prevent default submission behavior
  event.preventDefault();

  // Grab the values from the form fields
  const reviewForm = document.querySelector('#review-form'),
        userName = document.querySelector('#name').value,
        userRating = document.querySelector('#review-radios input[type=radio]:checked').value,
        userComment = document.querySelector('#comments').value;

   // Construct them into a `review` object

  const reviewData = {
    restaurant_id: Number(window.getParameterByName('id')),
    name: userName,
    rating: Number(userRating),
    comments: userComment,
    createdAt: Number(new Date()),
    updatedAt: Number(new Date())
  }

  // POST the review to the server if online, which then puts in IDB
  // Otherwise, post to reviews queue if offline, then post to server when online
  if(window.navigator.onLine) {
    postToServer(reviewData);
  } else {
    addReviewToQueue()
    .then(postToServer(reviewData));
  }

  // Refresh page (in a hacky sort of way) to re-populate reviews
  window.navigator.onLine ? window.location.reload(true) : window.location.reload(false);

  // Clear/reset the form fields
  // reviewForm.reset();
}


// STEPS
// 1. Check if user is online
// 2. If offline, capture data in IDB reviewsQueue
// 3. Notify user they are offline
// 4. Else, postToServer()
// 5. When back online, postToServer
// 6. And copy reviewQueue data to IDB reviews
// 7. Clear reviewQueue data
// 8. Refresh page

/**
 * Add to queue
 */
function addReviewToQueue(data) {
  DBHelper.openDb.then(db => {
    const queueStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
    return queueStore.openCursor();
  })
  .then(DBHelper.postNextReview());
}

/**
 * Attempt to post the pending reviews
 */
function postNextReview(cursor) {
  if (!cursor) return;
  postToServer(cursor.value);
  cursor.delete();
  return cursor.continue()
                .then(postFromReviewQueue());
}

function postFromReviewQueue() {
  DBHelper.openDb.then(db => {
    const queueStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
    return queueStore.openCursor();
  })
  .then(DBHelper.postNextReview());
}

/*
 * Store server data into IDB
 */

function storeInIDB(serverData) {
  // look at server reviews
  fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${self.restaurant.id}`)
  .then(response => response.json())
  .then(reviews => {
    // Get database object
    // Open transaction on database
    // Open object store on transaction
    // Perform operation on object store
    DBHelper.openDb.then( db => {
      const reviewStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
      reviews.forEach(
        review => reviewStore.openCursor(review)
      );
      return reviewStore.complete;
    });
  })
  .then(() => console.log('Reviews updated in IDB!' + serverData))
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
  .then(() => storeInIDB(data))
  .catch(err => console.log(err));
}
