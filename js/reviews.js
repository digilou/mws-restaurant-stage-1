const reviewForm = document.forms,
      userName = document.forms.namedItem('name'),
      userRating = document.querySelectorAll('#review-radios input[type=radio]'),
      userComment = document.forms.namedItem('comments'),
      reviewBtn = document.forms.namedItem('review-submit');

// Example POST method implementation:

postData(`${DBHelper.DATABASE_URL}/reviews`, {answer: 42})
  .then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
  .catch(error => console.error(error));

function postData(url = ``, data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response.json()); // parses response to JSON
}

function getFormData(e) {
  // stop default behavior
  e.preventDefault();
	e.stopImmediatePropagation();
  // iterate through form element values
  // store each value into IDB
  addReviews();

  // fetch data and post on page
  appendFormData();
}

function appendFormData() {
  // fetch data from reviews IDB store
  fetch(`${DBHelper.DATABASE_URL}/reviews`)
  .then()
  .then()
  .catch();
  // append data on same page
  createReviewsHTML();
}

// Iterate through all radio buttons
// Add a click event listener to the labels
// Get value of checked radio
Array.prototype.forEach.call( (el, i) => {
	let label = el.nextSibling.nextSibling;
	label.addEventListener("click", () => userRating.value );
});

// When the form gets submitted, post form data
reviewForm.addEventListener('submit', getFormData, false);