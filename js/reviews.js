const reviewBtn = document.forms.namedItem('review-submit'),
      userName = document.forms.namedItem('name'),
      userRating = document.querySelectorAll('#review-radios input[type=radio]'),
      userComment = document.forms.namedItem('comments');

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
document.querySelector('#review-form').addEventListener('submit', getFormData, false);