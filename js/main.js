"use strict";
var Callbacks = require("./Callbacks.js");
$(document).ready(function () {
    if (!window.MAPS_API_KEY || window.MAPS_API_KEY === "your_key_here") {
        $('#map').html('<div class="container"><br><br><br><br><h1>MapBox API key</h1><p>Please obtain your API key from the site: <a href="https://docs.mapbox.com/help/glossary/access-token/">https://docs.mapbox.com/help/glossary/access-token/</a></p><p>Then put it into <strong>prod.js</strong> file (!!!and then rebuild using webpack command from Readme!!!)</p><p><a class="btn btn-primary btn-lg" href="https://docs.mapbox.com/help/glossary/access-token/" role="button">Get a Key &raquo;</a></p></div>');
    } else {
        window.mapboxgl.accessToken = MAPS_API_KEY;
		new Callbacks().start();
    }
});
