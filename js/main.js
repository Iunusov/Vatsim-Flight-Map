"use strict";
var App = require("./App.js");
var Callbacks = require("./Callbacks.js");
$(document).ready(function () {
    if (!window.GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY === "your_key_here") {
        $('#map_canvas').html('<div class="container"><br><br><br><br><h1>Google Maps API key</h1><p>Please obtain your API key from the Google site: <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">https://developers.google.com/maps/documentation/javascript/get-api-key</a></p><p>Then put it into <strong>prod.js</strong> file</p><p><a class="btn btn-primary btn-lg" href="https://developers.google.com/maps/documentation/javascript/get-api-key" role="button">Get a Key &raquo;</a></p></div>');
    } else {
        window.googleMapsLoaded = function () {
            console.log("googleMapsLoaded");
            new Callbacks(new App()).start();
        }
        $.getScript('//maps.googleapis.com/maps/api/js?key=' + window.GOOGLE_MAPS_API_KEY + '&callback=googleMapsLoaded');
    }
});
