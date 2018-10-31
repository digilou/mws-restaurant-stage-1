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

  // push data to IDB review-queue


  // POST the review to the server, which then puts in IDB
  postToServer(reviewData);


  // Clear/reset the form fields
  reviewForm.reset();
}

function postIDBtoPage() {
  DBHelper.openDb.then( db => {
    const reviewStore = db.transaction('reviews', 'readwrite').objectStore('reviews').index('restaurant_id');
    db.get(reviewStore);
    return reviewStore.complete;
  })
}

function storeInIDB(serverData, callback) {
  // look at server reviews
  fetch(`${DBHelper.DATABASE_URL}/reviews`)
  .then(response => response.json())
  .then(reviews => {
    // Get database object
    // Open transaction on database
    // Open object store on transaction
    // Perform operation on object store
    DBHelper.openDb.then( db => {
      const reviewStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
      reviews.forEach(
        review => reviewStore.put(review)
      );
      callback(null, reviews);
      return reviewStore.complete;
    });
  })
  .then(() => console.log('Reviews updated in IDB!'))
  .catch(err => console.log(err));
}

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

/****** Queue Reviews **********/

  /**
   * Add to queue
   */
  function addReviewToQueue(data, callback) {
    DBHelper.openDb.then(db => {
      const tx = db.transaction('reviewQueue', 'readwrite'),
            queueStore = tx.objectStore('reviewQueue');
      return queueStore.openCursor();
    })
    .then(DBHelper.postNextReview())
    .then(() => {
      callback(null, `Connection reinstated. Your review has been posted!`);
    })
    .catch(error => {
      callback(`${error}. It appears you're offline. Please try again later.`, null);
    });
  }

  /**
   * Attempt to post the pending reviews
   */
  function postNextReview(cursor) {
    if (!cursor) return;
    DBHelper.stringifyReview(cursor.value);
    cursor.delete();
    return cursor.continue()
                 .then(DBHelper.postFromReviewQueue());
  }

  function postFromReviewQueue(callback) {
    DBHelper.openDb.then(db => {
      const tx = db.transaction('reviewQueue', 'readwrite'),
            store = tx.objectStore('reviewQueue');
      return store.openCursor();
    })
    .then(DBHelper.postNextReview())
    .then( () => {
      callback(null, 'Your review has been posted!');
    })
    .catch(error => {
      callback(error, null)
    });
  }