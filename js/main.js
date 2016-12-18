"use strict";
var App = require("./App.js");
if (typeof jQuery === "function") {
	jQuery(function ($) {
		$("#searchrow").removeClass("hidden");
		window.googleMapsLoaded = function () {
			var app = new App();
			app.initialize();
			$("#inputCallsign").autocomplete({
				source : [],
				open : function (result) {
					if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
						$('.ui-autocomplete').off('menufocus hover mouseover');
					}
				},
				select : function (event, ui) {
					setTimeout(function () {
						document.activeElement.blur();
						$('#buttonCallsign').click();
					}, 200);
				}
			});
			app.doPoll().then(function () {
				var callSign = app.getUrlParam("c", document.URL);
				if (callSign) {
					app.searchForCallsign(callSign);
				}
			});
			$(window).focus(function () {
				app.doPoll();
			});
			$("#buttonCallsign").click(function () {
				setTimeout(function () {
					app.searchForCallsign($('#inputCallsign').val());
				}, 200);
			});
			$("#inputCallsign").keypress(function (e) {
				if (e.which == 13) {
					$("#buttonCallsign").click();
					return false;
				}
			});
		};
		if (!window.GOOGLE_MAPS_API_KEY || window.GOOGLE_MAPS_API_KEY === "your_key_here") {
			$('#map_canvas').html('<div class="container"><br><br><br><br><h1>Google Maps API key</h1><p>Please obtain your API key from the Google site: <a href="https://developers.google.com/maps/documentation/javascript/get-api-key">https://developers.google.com/maps/documentation/javascript/get-api-key</a></p><p>Then put it into <strong>prod.js</strong> file</p><p><a class="btn btn-primary btn-lg" href="https://developers.google.com/maps/documentation/javascript/get-api-key" role="button">Get a Key &raquo;</a></p></div>');
		} else {
			$.getScript('//maps.googleapis.com/maps/api/js?key=' + window.GOOGLE_MAPS_API_KEY + '&callback=googleMapsLoaded');
		}
	});
}
