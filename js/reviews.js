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

  // POST the review to the server, which then puts in IDB
  postToServer(reviewData);

  // Refresh page (in a hacky sort of way) to re-populate reviews
  window.navigator.onLine ? window.location.reload(true) : window.location.reload(false);

  // Clear/reset the form fields
  // reviewForm.reset();
}


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
        review => reviewStore.put(review)
      );
      return reviewStore.complete;
    });
  })
  .then(() => console.log('Reviews updated in IDB!' + serverData))
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