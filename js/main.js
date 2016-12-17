"use strict";
var App = require("./App.js");
if (typeof jQuery === "function") {
	jQuery(function ($) {
		window.googleMapsLoaded = function () {
			var app = new App();
			app.initialize();
			$("#search").autocomplete({
				source : [],
				open : function (result) {
					if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
						$('.ui-autocomplete').off('menufocus hover mouseover');
					}
				},
				select : function (event, ui) {
					setTimeout(function () {
						document.activeElement.blur();
						$('#cssearch').click();
					}, 200);
				}
			});
			app.loopFunction().then(function () {
				var callSign = app.getUrlParam("c", document.URL);
				if (callSign) {
					app.searchForCallsign(callSign);
				}
			});
			$("#cssearch").click(function () {
				setTimeout(function () {
					app.searchForCallsign($('#search').val());
				}, 200);
			});
		};
		if (!window.GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY === "your_key_here") {
			$('#map_canvas').html('<div class="container"><br><br><br><br><h1>Google Maps API key</h1><p>Please obtain your API key from the Google site: <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">https://developers.google.com/maps/documentation/javascript/get-api-key</a></p><p>Than put it into <strong>prod.js</strong> file</p><p><a class="btn btn-primary btn-lg" href="https://developers.google.com/maps/documentation/javascript/get-api-key" role="button">Get a Key &raquo;</a></p></div>');
		} else {
			$.getScript('//maps.googleapis.com/maps/api/js?key=' + window.GOOGLE_MAPS_API_KEY + '&callback=googleMapsLoaded');
		}
	});
}
