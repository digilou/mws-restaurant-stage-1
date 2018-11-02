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
  window.navigator.onLine ? postToServer(reviewData) : addReviewToQueue();

  // Refresh page (in a hacky sort of way) to re-populate reviews
  window.navigator.onLine ? window.location.reload(true) : window.location.reload(false);

  // Clear/reset the form fields
  // reviewForm.reset();
  
  // listen for online status
  window.addEventListener('online', () => {
    console.log("Back online!");
  });
}


// STEPS
// 1. Check if user is online
// 2. If offline, capture data in IDB reviewsQueue
// Get database object
// Open transaction on database
// Open object store on transaction (reviewQueue)
// Perform operation on object store...
// reviews.forEach(review => reviewQueue.put(review))
// 3. Notify user they are offline
// .then(notifyUser(message))
// pop-up/modal
// or console.log() ?
// 4. Post review on page (even when offline)
// createReviewHTML()
// 5. Else, postToServer()
// So, when I want to save a review, I do a check (if statement) to see if online.  If offline, save to offline reviews.  If online, save to server (which then updates the online reviews DB
// and then I have an event listener that listens for ‘online’
// and runs the online handler function that tries to update reviews/favorites
// 5. When back online, postToServer()
// 6. Which copies reviewQueue data to IDB reviews
// 7. Clear reviewQueue data
// 8. Refresh page

/**
 * Modal with notification for user
 */

 function modalMsg() {
   // create a dialog
   // Your review will be posted when you are online.
   // a11y
 }


/**
 * Notify user that they are offline
 */

 function notifyUser() {
   console.log('Looks like you\'re offline!');
   modalMsg();
 }

/**
 * Add to queue
 */
function addReviewToQueue(data) {
  notifyUser()
  .then(reviews => {
    DBHelper.openDb.then( db => {
      const reviewStore = db.transaction('reviewQueue', 'readwrite').objectStore('reviewQueue');
      reviews.forEach(
        review => reviewStore.put(review)
      );
      return reviewStore.complete;
    });
  })
  .then(console.log('Reviews queued!'))
  .then(createReviewHTML())
  .then(reviewStore.clear())
  // .then(DBHelper.postNextReview());
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
