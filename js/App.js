"use strict";
var _ = require('underscore');
var Utils = require("./Utils.js");
var App = function () {
	var that = this;
	var pTimeout = false;
	var lastModified = "";
	var map = false;
	var markersArray = [];
	var infowindow = new google.maps.InfoWindow({});
	var tmpMarkersArray = [];
	var defaultLocation = null;
	var mapTypeId = null;
	var zoom = 3;
	var polyLine = null;
	var clientTemplate = _.template(require("raw-loader!../tpl/details.html"));
	var utils = new Utils();
	var objectToHTML = function (client) {
		client["altitude"] = utils.commaSeparateNumber(client["altitude"]);
		client["time_logon"] = client["time_online"];
		if (client.clienttype === "PILOT") {
			client["planned_deptime"] = utils.formatDepTime(client["planned_deptime"]);
			client["planned_actdeptime"] = utils.formatDepTime(client["planned_actdeptime"]);
		} else
			if (client.clienttype === "ATC") {
				client["time_last_atis_received"] = utils.formatDate(client["time_last_atis_received"]);
			}
		return clientTemplate({
			client : client
		});
	}
	var markerClickListener = function () {
		var marker = this;
		requestClientDetails(marker.vatsim_callsign, function (clientDetails) {
			openInfoWindow(clientDetails, map, marker);
		});

	}
	var openInfoWindow = function (client, map, marker) {
		if (polyLine) {
			polyLine.setMap(null);
		}
		closeInfoWindow();
		infowindow.vatsim_cid = client.cid;
		infowindow.setContent(objectToHTML(client));
		infowindow.open(map, marker);
		if (client.clienttype === "PILOT" && parseFloat(client["planned_destairport_lat"]) && parseFloat(client["planned_destairport_lon"]) && parseFloat(client["planned_depairport_lat"]) && parseFloat(client["planned_depairport_lon"])) {
			polyLine = new google.maps.Polyline({
					path : [new google.maps.LatLng(client.planned_depairport_lat, client.planned_depairport_lon), new google.maps.LatLng(client.latitude, client.longitude), new google.maps.LatLng(client.planned_destairport_lat, client.planned_destairport_lon), ],
					strokeColor : "#FF0000",
					strokeOpacity : 0.8,
					strokeWeight : 2,
					geodesic : true,
					map : map
				});
		}
		that.onOpenInfoWindow(client);
	};

	var closeInfoWindow = function () {
		infowindow.close();
		infowindow.setContent("");
		infowindow.vatsim_cid = -1;
		if (polyLine) {
			polyLine.setMap(null);
		}
		for (var i = 0; i < tmpMarkersArray.length; i++) {
			tmpMarkersArray[i].setMap(null);
		}
		tmpMarkersArray = [];
		that.onCloseInfoWindow();
	}

	var requestClientDetails = function (callsign, cb) {
		$.ajax({
			type : "GET",
			url : "getcdetails.php",
			data : {
				callsign : callsign
			},
			contentType : "application/json",
			dataType : "json",
			success : function (data, textStatus, request) {
				cb(data);
			}
		});
	}

	this.getMap = function () {
		return map;
	}
	this.onOpenInfoWindow = function () {};
	this.onCloseInfoWindow = function () {};
	this.onReceiveClientsArray = function () {};
	this.callSignsArray = [];
	this.getUrlParam = function (name, url) {
		if (!url) {
			url = location.href;
		}
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regexS = "[\\?&]" + name + "=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(url);
		return results == null ? null : results[1];
	}
	this.getClientsFromServer = function () {
		var dfd = $.Deferred();
		$.ajax({
			type : "GET",
			url : "getclients.php",
			contentType : "application/json",
			dataType : "json",
			success : function (data, textStatus, request) {
				var lm = request.getResponseHeader('Last-Modified');
				if (lm && lm == lastModified) {
					dfd.resolve();
					return dfd.promise();
				}
				lastModified = lm;
				for (var i = 0; i < markersArray.length; i++) {
					if (infowindow.vatsim_cid === markersArray[i].vatsim_cid) {
						tmpMarkersArray.push(markersArray[i]);
					} else {
						google.maps.event.clearInstanceListeners(markersArray[i]);
						markersArray[i].setMap(null);
						delete markersArray[i];
					}

				}
				markersArray = [];
				that.callSignsArray = [];
				$.each(data, function (index, client) {
					var cid = client[0];
					var callsign = client[1];
					var clienttype = client[2];
					var heading = client[3];
					var latitude = client[4];
					var longitude = client[5];
					that.callSignsArray.push(callsign);
					var icon = "img/undefined.png";
					if (!heading)
						heading = 0;
					if (clienttype === "PILOT") {
						icon = "img/planes/" + (360 - Math.round(heading / 20) * 20) + ".png";
					}
					if (clienttype === "ATC") {
						icon = "img/control.png";
					}
					if (clienttype === "PILOT" || clienttype === "ATC") {
						var marker = new google.maps.Marker({
								position : new google.maps.LatLng(latitude, longitude),
								map : map,
								title : callsign,
								icon : icon,
								vatsim_cid : client[0],
								vatsim_callsign : client[1]
							})
							marker.setMap(map);
						google.maps.event.addListener(marker, 'click', markerClickListener);
						markersArray.push(marker);
					}
				});
				that.onReceiveClientsArray(that.callSignsArray);
				dfd.resolve();
			}
		});
		return dfd.promise();
	};
	this.doPoll = function () {
		if (pTimeout) {
			clearTimeout(pTimeout);
			pTimeout = false;
		}
		var res = that.getClientsFromServer();
		pTimeout = setTimeout(that.doPoll, 60 * 1000);
		return res;
	}
	this.initialize = function (conf) {
		zoom = parseInt(conf['map_zoom']) || zoom;
		defaultLocation = new google.maps.LatLng(parseFloat(conf['map_center_lat']) || 44.996883999209636, parseFloat(conf['map_center_lng']) || -18.800782187499979);
		mapTypeId = _.contains(google.maps.MapTypeId, conf['map_type']) ? conf['map_type'] : google.maps.MapTypeId.TERRAIN;
		map = new google.maps.Map(document.getElementById("map_canvas"), {
				zoom : zoom,
				center : defaultLocation,
				disableDefaultUI : true,
				mapTypeId : mapTypeId,
				streetViewControl : false,
				mapTypeControl : true,
				zoomControl : true,
				mapTypeControlOptions : {
					style : google.maps.MapTypeControlStyle.DEFAULT,
					position : google.maps.ControlPosition.LEFT_BOTTOM
				}
			});
		google.maps.event.addListener(infowindow, 'closeclick', function () {
			closeInfoWindow();
		});
		google.maps.event.addListener(map, 'click', function () {
			closeInfoWindow();
		});
	};
	this.searchForCallsign = function (callsign) {
		callsign = $.trim(callsign.toUpperCase());
		for (var i = 0; i < markersArray.length; i++) {
			var current_calsign = markersArray[i].vatsim_callsign.toUpperCase();
			if (current_calsign === callsign) {
				requestClientDetails(callsign, function (clientDetails) {
					openInfoWindow(clientDetails, map, markersArray[i]);
				});
				break;
			}
		}
	}
};
module.exports = App;
