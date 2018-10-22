/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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
 * Grab input data, put in IDB, post to page
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
    "restaurant_id": window.getParameterByName('id'),
    "name": userName,
    "rating": userRating,
    "comments": userComment,
    "createdAt": new Date(reviewForm.createdAt),
    "updatedAt": new Date(reviewForm.updatedAt)
  }

  // put it into IDB (in either order; these could be two separate steps)
  pushDataIntoIDB(reviewData);
  
  // POST the review to the server
  postToServer(reviewData);

  // Clear/reset the form fields
  document.forms.reset();
  
  // Reset URL back to the restaurant id page
  urlForRestaurant(reviewData.restaurant_id);
}

function pushDataIntoIDB(data) {
  DBHelper.openDb.then(db => {
    const tx = db.transaction('reviews', 'readwrite'),
          reviewsStore = tx.objectStore('reviews');
    return reviewsStore.openCursor();
  })
  .then(
    DBHelper.stringifyReview(window.getParameterByName('id'), data)
  )
}

function postToServer(data) {
  DBHelper.openDb.then(db => {
    const tx = db.transaction('reviews', 'readyonly'),
          reviewsStore = tx.objectStore('reviews');
    
    return reviewsStore.openCursor();
  });
}

function stringifyReview(data) {
  return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json()) // parse response to JSON
  .catch(err => console.log(err));
}

function appendFormData(data) {
  // fetch data from reviews server
  fetch(`${DBHelper.DATABASE_URL}/reviews`)
  .then(response => response.json())
  .then(createReviewsHTML(data))
  .catch(err => console.log(err));
}

// Iterate through all radio buttons
// Add a click event listener to the labels
// Get value of checked radio
// Array.prototype.forEach.call( (el, i) => {
// 	let label = el.nextSibling.nextSibling;
// 	label.addEventListener("click", () => userRating.value );
// });

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