if('serviceWorker' in navigator) {
  navigator.serviceWorker
           .register('/sw.js', { scope: "/" })
           .then(reg => {
             console.log('Successful: ' + reg.scope);
           })
           .catch(err => {
             console.log('Error: ' + err);
           });
}