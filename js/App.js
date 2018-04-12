"use strict";
var _ = require('underscore');
var Utils = require("./Utils.js");
var App = function () {
	var that = this;
	var pTimeout = false;
	var timeStamp = null;
	var map = false;
	var markersArray = [];
	var infowindow = new google.maps.InfoWindow({});
	var infowindowMarker = null;
	var defaultLocation = null;
	var mapTypeId = null;
	var zoom = 3;
	var polyLine = null;
	var clientTemplate = _.template(require("raw-loader!../tpl/details.html"));
	var utils = new Utils();
	var objectToHTML = function (src) {
		var client = $.extend({}, src);
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
			"client" : client
		});
	}
	var markerClickListener = function () {
		var marker = this;
		requestClientDetails(marker, function (clientDetails) {
			openInfoWindow(clientDetails, map, marker);
		});
	}
	var openInfoWindow = function (client, map, marker) {
		if (polyLine) {
			polyLine.setMap(null);
		}
		closeInfoWindow();
		infowindow.vatsim_cid = marker.vatsim_cid;
		infowindow.setContent(objectToHTML(client));
		infowindow.open(map, marker);
		if (client.clienttype === "PILOT" && !isNaN(client["planned_destairport_lat"]) && !isNaN(client["planned_destairport_lon"]) && !isNaN(client["planned_depairport_lat"]) && !isNaN(client["planned_depairport_lon"])) {
			polyLine = new google.maps.Polyline({
					path : [new google.maps.LatLng(client.planned_depairport_lat, client.planned_depairport_lon), new google.maps.LatLng(client.latitude, client.longitude), new google.maps.LatLng(client.planned_destairport_lat, client.planned_destairport_lon)],
					strokeColor : "#FF0000",
					strokeOpacity : 0.8,
					strokeWeight : 2,
					geodesic : true,
					map : map
				});
		}
		map.setOptions({
			zoomControl : false,
			mapTypeControl : false
		});
		that.onOpenInfoWindow(client);
	};
	var closeInfoWindow = function () {
		infowindow.close();
		infowindow.vatsim_cid = null;
		if (infowindowMarker) {
			infowindowMarker.setMap(null);
		}
		infowindowMarker = null;
		if (polyLine) {
			polyLine.setMap(null);
		}
		map.setOptions({
			zoomControl : true,
			mapTypeControl : true
		});
		that.onCloseInfoWindow();
	}
	var requestClientDetails = function (marker, cb) {
		$.ajax({
			timeout : 5000,
			type : "GET",
			url : "api/getcdetails.php",
			data : {
				"cid" : marker.vatsim_cid,
				"callsign" : marker.vatsim_callsign,
				"ts" : timeStamp
			},
			contentType : "application/json",
			dataType : "json",
			success : function (client, textStatus, request) {
				cb(utils.parseClientDetails(client));
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
			timeout : 5000,
			type : "GET",
			url : "api/getclients.php",
			contentType : "application/json",
			dataType : "json",
			success : function (result, textStatus, request) {
				var ts = result.timestamp;
				if (ts && ts === timeStamp) {
					dfd.resolve();
					return;
				}
				timeStamp = ts;
				for (var i = 0; i < markersArray.length; i++) {
					if (!infowindowMarker && infowindow.vatsim_cid !== null && infowindow.vatsim_cid === markersArray[i].vatsim_cid) {
						infowindowMarker = markersArray[i];
						continue;
					}
					google.maps.event.clearInstanceListeners(markersArray[i]);
					markersArray[i].setMap(null);
					delete markersArray[i];
				}
				markersArray = [];
				that.callSignsArray = [];
				var data = result["data"];
				$.each(data, function (index, client) {
					var cid = parseInt(client[0]);
					if (isNaN(cid)) {
						return true;
					}
					var callsign = client[1];
					var clienttype = client[2];
					var heading = parseFloat(client[3]) || 0;
					var latitude = parseFloat(client[4]);
					if (isNaN(latitude)) {
						return true;
					}
					var longitude = parseFloat(client[5]);
					if (isNaN(longitude)) {
						return true;
					}
					that.callSignsArray.push(callsign);
					var icon = "img/undefined.png";
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
								vatsim_cid : cid,
								vatsim_callsign : callsign,
							})
							marker.setMap(map);
						google.maps.event.addListener(marker, 'click', markerClickListener);
						markersArray.push(marker);
						if (infowindow.vatsim_cid !== null && infowindow.vatsim_cid === cid) {
							requestClientDetails(marker, function (clientDetails) {
								infowindow.setContent(objectToHTML(clientDetails));
							});
						}
					}
				});
				that.onReceiveClientsArray(that.callSignsArray);
				dfd.resolve();
			},
			error : function () {
				dfd.reject();
			}
		});
		return dfd.promise();
	};
	this.doPoll = function (success_cb) {
		(that.getClientsFromServer()).done(function () {
			if (success_cb) {
				success_cb();
			}
		}).always(function () {
			if (pTimeout) {
				clearTimeout(pTimeout);
				pTimeout = false;
			}
			pTimeout = setTimeout(that.doPoll, 2 * 60 * 1000);
		});
	}
	this.initialize = function (conf) {
		zoom = parseInt(conf['map_zoom']) || zoom;
		defaultLocation = new google.maps.LatLng(parseFloat(conf['map_center_lat']) || 44.99688, parseFloat(conf['map_center_lng']) || -18.80078);
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
			var current_cid = markersArray[i].vatsim_cid; ;
			if (current_calsign === callsign) {
				requestClientDetails(markersArray[i], function (clientDetails) {
					openInfoWindow(clientDetails, map, markersArray[i]);
				});
				break;
			}
		}
	}
};
module.exports = App;
