# Restaurant Reviews

## What is it?

"Restaurant Reviews" wants to help you find restaurants in your area, based on neighborhood and taste preferences.

## A Note about Data and UX

### Data

Currently, the API is very limited and only built around NYC with a few restaurant suggestions.

### UX

This app was developed with mobile in mind, so the best experience will be on your mobile device.

## Run It

Currently, this project can be run locally with Python and Node using two repos.

### Python server

With Python 3 installed, run in your CLI:
`python -m http.server 8000`

### Node server

The data (API) for this app is stored elsewhere. To tap into that data, download my forked repo for [Stage 2](https://github.com/digilou/mws-restaurant-stage-2) and follow the instructions there to start that node server.

## Background and Checks

This web application has been tested for accessibility, performance, best practices, and progressive web app conformance. A service worker has been installed, along with [IndexedDB](https://github.com/jakearchibald/idb) for additional caching and storage power. An offline-first approach was taken from the very beginning of development. ES6 has been embraced here, just as I embrace the future of web development.

## Credit

Built during the Google Udacity Scholars nanodegree program to earn a [Mobile Web Specialist Certification](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024).