"use strict";
var Callbacks = function () {
	var app = {};

	this.setApp = function (app_) {
		app = app_;
	}

	this.start = function () {
		var conf = {};
		if (("localStorage" in window) && window["localStorage"] != null) {
			conf["map_center_lat"] = localStorage.getItem("map_center_lat");
			conf["map_center_lng"] = localStorage.getItem("map_center_lng");
			conf["map_zoom"] = localStorage.getItem("map_zoom");
			conf["map_type"] = localStorage.getItem("map_type");
		}
		app.initialize(conf);
		bindHandlers();
		app.doPoll().then(function () {
			var callSign = app.getUrlParam("c", document.URL);
			if (callSign) {
				app.searchForCallsign(callSign);
			}
		});
	}

	var saveParamsToLocalStorage = function (app, callSign) {
		if (("localStorage" in window) && window["localStorage"] != null && app.getMap()) {
			localStorage.setItem("map_center_lat", app.getMap().getCenter().lat());
			localStorage.setItem("map_center_lng", app.getMap().getCenter().lng());
			localStorage.setItem("map_zoom", app.getMap().zoom);
			localStorage.setItem("map_type", app.getMap().getMapTypeId());
			localStorage.setItem("currentCallsign", callSign);
		}
	}

	var getCallsignFromLocalStorage = function () {
		if (("localStorage" in window) && window["localStorage"] != null) {
			var currentCallsign = localStorage.getItem("currentCallsign");
			if (currentCallsign) {
				return currentCallsign;
			}
		}
		return "";
	}

	var bindHandlers = function () {
		var infoWindowContentId = "#infoWindowContent";
		var searchrow = $("#searchrow");
		var inputCallsign = $("#inputCallsign");
		var buttonCallsign = $("#buttonCallsign");

		searchrow.removeClass("hidden");

		inputCallsign.val(getCallsignFromLocalStorage());

		app.onOpenInfoWindow = function (client) {
			searchrow.hide();
			$(infoWindowContentId).parent().parent().css("max-height", "9999px");
			if (window && window.history && window.history.replaceState) {
				var callSign = client.callsign;
				if (callSign) {
					history.replaceState({}, document.title, "?c=" + callSign);
				}
			}
			saveParamsToLocalStorage(app, inputCallsign.val());
		}

		app.onCloseInfoWindow = function () {
			searchrow.show();
			if (window && window.history && window.history.replaceState) {
				history.replaceState({}, document.title, '//' + location.host + location.pathname);
			}
			saveParamsToLocalStorage(app, inputCallsign.val());
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
			saveParamsToLocalStorage(app, inputCallsign.val());
		};

		$(window).focus(function () {
			app.doPoll();
		});
	}
}
module.exports = Callbacks;
