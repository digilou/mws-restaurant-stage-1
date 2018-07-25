const port = 1337,
      database_url = `http://localhost:${port}/restaurants`;

fetch(database_url)
  .then(response => response.json())
  .then(fetchRestaurants)
  .catch(e => requestError(e, 'restaurant'));

function fetchRestaurants()

// Catch error
function requestError(e, part) {
  console.log(e);
  responseContainer.insertAdjacentHTML('beforeend', `<p class="network-warning">Oh no! There was an error making a request for the ${part}.</p>`);
}

