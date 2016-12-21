"use strict";
var Callbacks = function () {
	var infoWindowContentId = "#infoWindowContent";
	var searchrow = $("#searchrow");
	var inputCallsign = $("#inputCallsign");
	var buttonCallsign = $("#buttonCallsign");
	this.set = function (app) {
		window.googleMapsLoaded = function () {
			var conf = {};
			if (("localStorage" in window) && window["localStorage"] != null) {
				conf["map_center_lat"] = localStorage.getItem("map_center_lat");
				conf["map_center_lng"] = localStorage.getItem("map_center_lng");
				conf["map_zoom"] = parseInt(localStorage.getItem("map_zoom"));
				conf["map_type"] = localStorage.getItem("map_type");
				var currentCallsign = localStorage.getItem("currentCallsign");
				if (currentCallsign) {
					inputCallsign.val(currentCallsign);
				}
			}
			app.initialize(conf);
			app.doPoll().then(function () {
				searchrow.removeClass("hidden");
				var callSign = app.getUrlParam("c", document.URL);
				if (callSign) {
					app.searchForCallsign(callSign);
				}
			});
		};
		window.onfocus = function () {
			app.doPoll();
		};
		app.onOpenInfoWindow = function (client) {
			searchrow.hide();
			$(infoWindowContentId).parent().parent().css("max-height", "9999px");
			if (window && window.history && window.history.pushState) {
				var callSign = client.callsign;
				if (callSign) {
					history.replaceState({}, document.title, "?c=" + callSign);
				}
			}
		}
		app.onCloseInfoWindow = function () {
			searchrow.show();
			history.replaceState({}, document.title, '//' + location.host + location.pathname);
		}
		app.onReceiveClientsArray = function (callSignsArray) {
			inputCallsign.autocomplete("option", {
				source : callSignsArray
			});
		}
		inputCallsign.autocomplete({
			source : [],
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
		buttonCallsign.click(function () {
			setTimeout(function () {
				app.searchForCallsign(inputCallsign.val());
			}, 200);
		});
		inputCallsign.keypress(function (e) {
			if (e.which == 13) {
				buttonCallsign.click();
				return false;
			}
		});
		window.onbeforeunload = function (e) {
			if (("localStorage" in window) && window["localStorage"] != null && app.isInitialized()) {
				localStorage.setItem("map_center_lat", app.getMap().getCenter().lat());
				localStorage.setItem("map_center_lng", app.getMap().getCenter().lng());
				localStorage.setItem("map_zoom", app.getMap().zoom);
				localStorage.setItem("map_type", app.getMap().getMapTypeId());
			}
			localStorage.setItem("currentCallsign", inputCallsign.val());
		};
	}
}
module.exports = Callbacks;
