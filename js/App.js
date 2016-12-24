"use strict";
var App = function () {
	var initialized = false;
	var that = this;
	var pTimeout = false;
	var lastModified = null;
	var map = null;
	var markersArray = [];
	var clients = [];
	var infowindow = null;
	var tmpMarkersArray = [];
	var defaultLocation = null;
	var mapTypeId = null;
	var zoom = 3;
	var polyLine = null;
	var clientTemplate = null;
	var infowindowOpened = false;
	var getProp = function (obj, prop) {
		if (prop in obj)
			return obj[prop];
		return "";
	}
	var getFlightType = function (s) {
		var result = s;
		if (s === "I") {
			result = "IFR";
		}
		if (s === "V") {
			result = "VFR";
		}
		return result;
	}
	var formatDate = function (obj, prop) {
		if (getProp(obj, prop) === "")
			return "";
		return getProp(obj, prop).substring(8, 10) + ":" + getProp(obj, prop).substring(10, 12) + ":" + getProp(obj, prop).substring(12, 14);
	}
	var formatNumber = function (num) {
		var res = num.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
		if (res != "")
			return res;
		return "0";
	}
	var formatDepTime = function (obj, prop) {
		var deptime = getProp(obj, prop);
		if (deptime === "" || deptime === "0") {
			return "";
		}
		while (deptime.length < 4) {
			deptime = "0" + deptime;
		}
		return deptime.substring(0, 2) + ":" + deptime.substring(2, 4);
	}
	var objectToHTML = function (client) {
		client["altitude"] = formatNumber((getProp(client, "altitude")));
		client["time_logon"] = formatDate(client, "time_logon");
		if (client.clienttype === "PILOT") {
			client["planned_deptime"] = formatDepTime(client, "planned_deptime");
			client["planned_actdeptime"] = formatDepTime(client, "planned_actdeptime");
		} else
			if (client.clienttype === "ATC") {
				client["time_last_atis_received"] = formatDate(client, "time_last_atis_received");
			}
		return clientTemplate({
			client : client
		});
	}
	var openInfoWindow = function (client, map, marker) {
		if (polyLine) {
			polyLine.setMap(null);
		}
		infowindow.close();
		infowindow.vs_cid = client.cid;
		infowindow.setContent(objectToHTML(client));
		infowindow.open(map, marker);
		infowindowOpened = true;
		if (client.clienttype === "PILOT" && "planned_destairport_lat" in client && client.planned_destairport_lat != 0 && "planned_destairport_lon" in client && client.planned_destairport_lon != 0 && "planned_depairport_lat" in client && client.planned_depairport_lat != 0 && "planned_depairport_lon" in client && client.planned_depairport_lon != 0)
			polyLine = new google.maps.Polyline({
					path : [new google.maps.LatLng(client.planned_depairport_lat, client.planned_depairport_lon), new google.maps.LatLng(client.latitude, client.longitude), new google.maps.LatLng(client.planned_destairport_lat, client.planned_destairport_lon), ],
					strokeColor : "#FF0000",
					strokeOpacity : 0.8,
					strokeWeight : 2,
					geodesic : true,
					map : map
				});
		that.onOpenInfoWindow(client);
	};
	var requestClientDetails = function (cid, callsign, cb) {
		$.ajax({
			type : "GET",
			url : "getcdetails.php",
			data : {
				cid : cid,
				callsign : callsign
			},
			contentType : "application/json",
			dataType : "json",
			success : function (data, textStatus, request) {
				cb(data);
			},
			error : function (xhr, ajaxOptions, thrownError) {
				if (xhr.status == 404) {
					window.location.reload(true);
				}
			}
		});
	}
	var __onCloseInfoWindow = function () {
		if (polyLine) {
			polyLine.setMap(null);
		}
		infowindow.vs_cid = -1;
		for (var i = 0; i < tmpMarkersArray.length; i++) {
			tmpMarkersArray[i].setMap(null);
			delete tmpMarkersArray[i].vatsim_client_arr;
		}
		tmpMarkersArray = [];
		that.onCloseInfoWindow();
		infowindowOpened = false;
	}
	this.isInitialized = function () {
		return initialized;
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
		if (!initialized) {
			dfd.reject();
			return dfd.promise();
		}
		$.ajax({
			type : "GET",
			url : "getclients.php",
			contentType : "application/json",
			dataType : "json",
			success : function (data, textStatus, request) {
				var lm = request.getResponseHeader('Last-Modified');
				if (lm != null && lm == lastModified) {
					dfd.resolve();
					return dfd.promise();
				}
				lastModified = lm;
				for (var i = 0; i < markersArray.length; i++) {
					if (infowindow.vs_cid === markersArray[i].vatsim_client_arr[0]) {
						tmpMarkersArray.push(markersArray[i]);
					} else {
						markersArray[i].setMap(null);
						delete markersArray[i].vatsim_client_arr;
					}
					google.maps.event.clearInstanceListeners(markersArray[i]);
				}
				clients = data;
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
								vatsim_client_arr : clients[index]
							})
							marker.setMap(map);
						google.maps.event.addListener(marker, 'click', function () {
							requestClientDetails(cid, callsign, function (clientDetails) {
								openInfoWindow(clientDetails, map, marker);
							});
						});
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
		clientTemplate = _.template(require("raw-loader!../tpl/details.html"));
		defaultLocation = new google.maps.LatLng(44.996883999209636, -18.800782187499979);
		mapTypeId = google.maps.MapTypeId.TERRAIN;
		if (conf['map_center_lat'] && conf['map_center_lng']) {
			defaultLocation = new google.maps.LatLng(conf['map_center_lat'], conf['map_center_lng']);
		}
		if (conf['map_zoom']) {
			zoom = parseInt(conf['map_zoom']);
		}
		if (conf['map_type']) {
			mapTypeId = conf['map_type'];
		}
		infowindow = new google.maps.InfoWindow({});
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
			__onCloseInfoWindow();
		});
		google.maps.event.addListener(map, 'click', function () {
			if (!infowindowOpened) {
				return;
			}
			__onCloseInfoWindow();
			infowindow.close();
		});
		initialized = true;
	};
	this.searchForCallsign = function (callsign) {
		if (!initialized) {
			return;
		}
		callsign = $.trim(callsign.toUpperCase());
		for (var i = 0; i < markersArray.length; i++) {
			var current_calsign = markersArray[i].vatsim_client_arr[1];
			var current_cid = markersArray[i].vatsim_client_arr[0];
			if (current_calsign === callsign) {
				requestClientDetails(current_cid, callsign, function (clientDetails) {
					openInfoWindow(clientDetails, map, markersArray[i]);
				});
				break;
			}
		}
	}
};
module.exports = App;
