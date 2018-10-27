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
    restaurant_id: window.getParameterByName('id'),
    name: userName,
    rating: userRating,
    comments: userComment
  }

  // POST the review to the server
  stringifyReview(reviewData);

  // put it into IDB
  pushDataIntoIDB(reviewData);

  // post to the page
  fillReviewsHTML(reviewData);

  // Clear/reset the form fields
  reviewForm.reset();
}

function pushDataIntoIDB(data) {
  DBHelper.openDb.then(db => {
    const reviewsStore = db.transaction('reviews', 'readwrite').objectStore('reviews');
    return reviewsStore.openCursor();
  })
  .then()
}

function postToServer(data) {
  fetch(`${DBHelper.DATABASE_URL}/reviews`)
  .then(response => response.json())
  .then(stringifyReview(window.getParameterByName('id'), data))
  .catch(err => console.log(err));
}

function stringifyReview(data) {
  return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data),
    credentials: 'same-origin',
    mode: 'no-cors'
  })
  .then(response => {
    if(response.ok) return response.json()
  }) // parse response to JSON
  .catch(err => console.log(err));
}

function appendFormData(data) {
  // fetch data from reviews server
  // get review from IDB
  DBHelper.openDb.then(db => {
    const reviewsStore = db.transaction('reviews', 'readonly').objectStore('reviews');
    
    return reviewsStore.openCursor();
  });
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