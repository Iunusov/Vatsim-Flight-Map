"use strict";

// Other files
var App = require("./App.js");
var Callbacks = require("./Callbacks.js");

// When the page is ready
$(document).ready(function () {

	// If the key has not been entered
	if (!window.GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY === "your_key_here") {

		// alert the user
		$('#map_canvas').html('<div class="container"><br><br><br><br><h1>Google Maps API key</h1><p>Please obtain your API key from the Google Maps API: <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">https://developers.google.com/maps/documentation/javascript/get-api-key</a></p><p>Place it into the <strong>prod.js</strong> file</p><p><a class="btn btn-primary btn-lg" href="https://developers.google.com/maps/documentation/javascript/get-api-key" role="button">Get a Key &raquo;</a></p></div>');
	} else {

		// Once the map has loaded
		window.googleMapsLoaded = function () {

			// Initialise the other callbacks and main application
			new Callbacks(new App());
		}

		// Google maps API
		$.getScript('https://maps.googleapis.com/maps/api/js?key=' + window.GOOGLE_MAPS_API_KEY + '&callback=googleMapsLoaded&v=3');
		console.log("Google Maps API Initialised.");
	}
});
