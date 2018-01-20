"use strict";

// Callback functions
class Callbacks {
	constructor(app_){

		// App variable
		this.app = app_;

		// Configuration object
		var conf = {};

		// If there is a localstorage section in the browser
		if (("localStorage" in window) && window["localStorage"] != null) {

			// Get the map position data from localstorage
			conf["map_center_lat"] = localStorage.getItem("map_center_lat");
			conf["map_center_lng"] = localStorage.getItem("map_center_lng");
			conf["map_zoom"] = localStorage.getItem("map_zoom");
			conf["map_type"] = localStorage.getItem("map_type");
		}

		// Initalise the App (Map) with the configuration
		this.app.initialize(conf);

		// Assign the event handlery
		bindHandlers();

		// Start the timer
		this.app.doPoll().then(function () {
			var callSign = this.app.getUrlParam("c", document.URL);
			if (callSign) {
				this.app.searchForCallsign(callSign);
			}
		});
	}

	// Saving map parameters to localstorage
	saveParamsToLocalStorage (app, callSign) {

		// If it exists in the browser and the map is there
		if (("localStorage" in window) && window["localStorage"] != null && app.getMap()) {

			// Add the data
			localStorage.setItem("map_center_lat", app.getMap().getCenter().lat());
			localStorage.setItem("map_center_lng", app.getMap().getCenter().lng());
			localStorage.setItem("map_zoom", app.getMap().zoom);
			localStorage.setItem("map_type", app.getMap().getMapTypeId());
			localStorage.setItem("currentCallsign", callSign);
		}
	}

	// Get a callsign from localstorage
	getCallsignFromLocalStorage () {

		// If it exists in the browser and the map is there
		if (("localStorage" in window) && window["localStorage"] != null) {

			// Get the callsign
			var currentCallsign = localStorage.getItem("currentCallsign");
			if (currentCallsign) {

				// Sent her back!
				return currentCallsign;
			}
		}
		return "";
	}

	// Binding event handlers
	bindHandlers () {

		// Getting the HTML DOM elements
		var infoWindowContentId = "#infoWindowContent";
		var searchrow = $("#searchrow");
		var inputCallsign = $("#inputCallsign");
		var buttonCallsign = $("#buttonCallsign");

		// Unhide search
		searchrow.removeClass("hidden");

		// Pre-insert callsign form localstorage
		inputCallsign.val(getCallsignFromLocalStorage());

		// When an infowindow is opened
		this.app.onOpenInfoWindow = function (client) {

			// Hide the searchwindow
			searchrow.hide();

			// Set the infowindow CSS
			$(infoWindowContentId).parent().parent().css("max-height", "9999px");

			// Not sure what this does...
			if (window && window.history && window.history.replaceState) {
				var callSign = client.callsign;
				if (callSign) {
					history.replaceState({}, document.title, "?c=" + callSign);
				}
			}

			// Save to localstorage
			saveParamsToLocalStorage(this.app, inputCallsign.val());
		}

		// Whan an infowindow is closed
		this.app.onCloseInfoWindow = function () {

			// Show the searchrow
			searchrow.show();

			// Still not sure what this does...
			if (window && window.history && window.history.replaceState) {
				history.replaceState({}, document.title, '//' + location.host + location.pathname);
			}

			// Save to localstorage
			saveParamsToLocalStorage(app, inputCallsign.val());
		}

		// Once the client array has been received
		this.app.onReceiveClientsArray = function (callSignsArray) {

			// Some autocomplete stuff?
			inputCallsign.autocomplete("option", {
				source : callSignsArray
			});
		}

		// More autocomplete stuff
		inputCallsign.autocomplete({
			source : [],
			delay: 0,
			minLength : 2,
			open : function (result) {
				if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
					$(".ui-autocomplete").off("menufocus hover mouseover");
				}
			},
			select : function (event, ui) {
				setTimeout(function () {
					document.activeElement.blur();
					buttonCallsign.click();
				}, 200);
			}
		});

		// Search button click
		buttonCallsign.click(function () {
			setTimeout(function () {
				this.app.searchForCallsign(inputCallsign.val());
			}, 200);
		});

		// On keypress for autocomplete
		inputCallsign.keypress(function (e) {
			if (e.which == 13) {
				buttonCallsign.click();
				return false;
			}
		});

		// Before the window closes
		window.onbeforeunload = function (e) {

			// Save to local storage
			saveParamsToLocalStorage(app, inputCallsign.val());
		};

		// when the window is focused
		$(window).focus(function () {
			// Refresh the map
			app.doPoll();
		});
	}
}
module.exports = Callbacks;
