"use strict";
jQuery(function ($) {
	var map = null;
	var markersArray = [];
	var clients = [];
	var infowindow = new google.maps.InfoWindow({
			maxWidth : 400
		});
	var tmpMarkersArray = [];
	var initLocation = new google.maps.LatLng(44.996883999209636, -18.800782187499979);
	var defaultLocation = new google.maps.LatLng(initLocation.lat(), initLocation.lng());
	var zoom = 3;
	if (('localStorage' in window) && window['localStorage'] != null) {
		if (localStorage.getItem('map_center_lat') && localStorage.getItem('map_center_lng')) {
			defaultLocation = new google.maps.LatLng(localStorage.getItem('map_center_lat'), localStorage.getItem('map_center_lng'));
		}
		if (localStorage.getItem('map_zoom')) {
			zoom = parseInt(localStorage.getItem('map_zoom'));
		}
	}
	function formatNumber (num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}
	function initialize() {
		map = new google.maps.Map(document.getElementById("map_canvas"), {
				zoom : zoom,
				center : defaultLocation,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			});
		google.maps.event.addListener(infowindow, 'closeclick', function () {
			infowindow.vs_cid = -1;
			for (var i in tmpMarkersArray) {
				tmpMarkersArray[i].setMap(null);
			}
			tmpMarkersArray = [];
		});
		google.maps.event.addListener(map, 'click', function () {
			infowindow.close();
		});
		window.onbeforeunload = function (e) {
			if (('localStorage' in window) && window['localStorage'] != null) {
				localStorage.setItem('map_center_lat', map.getCenter().lat());
				localStorage.setItem('map_center_lng', map.getCenter().lng());
				localStorage.setItem('map_zoom', map.zoom);
			}
		};
		loopFunction();
		setInterval(loopFunction, 60000);
	};
	function loopFunction() {
		$.getJSON("/clients.json?" + Math.random(), function (data) {
			for (var i in markersArray) {
				if (infowindow.vs_cid === clients[markersArray[i].client_array_id].cid)
					tmpMarkersArray.push(markersArray[i]);
				else
					markersArray[i].setMap(null);
				google.maps.event.clearInstanceListeners(markersArray[i]);
			}
			clients = data;
			markersArray = [];
			$.each(data, function (index, client) {
				var icon = "/img/undefined.png";
				if (!client.heading)
					client.heading = 0;
				if (client.clienttype == "PILOT") {
					icon = "/img/planes/" + (360 - client.heading + client.heading % 10) + ".png";
				}
				if (client.clienttype == "ATC") {
					icon = "/img/control.png";
					delete client["altitude"];
					delete client["heading"];
					delete client["planned_tascruise"];

				}
				if (client.clienttype == "PILOT" || client.clienttype == "ATC") {
					var marker = new google.maps.Marker({
							position : new google.maps.LatLng(client.latitude, client.longitude),
							map : map,
							title : client.callsign,
							icon : icon,
							callsign : client.callsign,
							client_array_id : index
						})
						marker.setMap(map);
					google.maps.event.addListener(marker, 'click', function () {
						openInfoWindow(makeBoxInfo(client), map, marker);
					});
					markersArray.push(marker);
				}
			});
		});
	};
	function makeBoxInfo(cl) {
		var client = $.extend(true, {}, cl);
		if("altitude" in client){
			client.altitude = formatNumber(parseInt(client.altitude))+" ft";
		}
		if("groundspeed" in client)
		client.groundspeed += " kts";
		if("planned_tascruise" in client)
		client.planned_tascruise += " kts";
		if (client.planned_hrsfuel && client.planned_hrsfuel > 0 || client.planned_minfuel && client.planned_minfuel > 0)
			client["fuel on board"] = client.planned_hrsfuel + "h " + client.planned_minfuel+"m"
		if (client.planned_hrsenroute && client.planned_hrsenroute > 0 || client.planned_minenroute && client.planned_minenroute > 0)
			client["enroute"] = client.planned_hrsenroute + "h " + client.planned_minenroute+"m";
		var title = "<table>";
		for (var key in client) {
			if ($.inArray(key, ["cid", "clienttype", "latitude", "longitude", "facilitytype", "planned_hrsfuel", "planned_minfuel", "planned_hrsenroute", "planned_minenroute"]) != -1) {
				continue;
			}
			var client_val = client[key];
			var client_key = key;
			if ((client_key == "planned_route" || client_key == "planned_remarks") && client_val) {
				client_val = "<details>" + client_val + "</details>";
			}
			if ((client_key == "planned_deptime" || client_key == "planned_actdeptime")) {
					while(client_val.length < 4){
						client_val = "0"+client_val;
					}
					client_val = client_val.substring(0, 2) + ":" + client_val.substring(2, 4);
			}
			if (key == "time_last_atis_received")
				client_key = "atis received";
			if (key == "time_logon")
				client_key = "logon";
			if ((key == "time_logon" || key == "time_last_atis_received") && client[key]) {
				client_val = client_val.substring(8, 10) + ":" + client_val.substring(10, 12) + ":" + client_val.substring(12, 14);
			}
			title += "<tr><td>" + client_key + "</td><td><b>" + client_val + "</b></td></tr>";
		}
		title += "</table>";
		title += "<br>";
		title += "<a href=\"http://vataware.com/pilot/" + client.cid + "\"" + " target=\"_blank\">Past flights (Vataware)</a>";
		return "<div class='info'>" + title + "</div>";
	}
	function openInfoWindow(content, map, marker) {
		infowindow.close();
		infowindow.vs_cid = clients[marker.client_array_id].cid;
		infowindow.setContent(content);
		infowindow.open(map, marker);
	};
	function searchForCallsign(callsign) {
		callsign = $.trim(callsign.toUpperCase());
		for (var i in markersArray) {
			if (markersArray[i].callsign == callsign) {
				openInfoWindow(makeBoxInfo(clients[markersArray[i].client_array_id]), map, markersArray[i]);
			}
		}
	}
	function showTopAirports() {
		var airports = {};
		var airports_array = [];
		$.each(clients, function (index, element) {
			if (element["clienttype"] == "PILOT") {
				if (typeof element["planned_destairport"] != "undefined") {
					element["planned_destairport"] = element["planned_destairport"].toUpperCase();
					if (typeof airports[element["planned_destairport"]] == "undefined")
						airports[element["planned_destairport"]] = 1;
					else {
						airports[element["planned_destairport"]]++;
					}
				}
				if (typeof element["planned_depairport"] != "undefined") {
					element["planned_depairport"] = element["planned_depairport"].toUpperCase();
					if (typeof airports[element["planned_depairport"]] == "undefined")
						airports[element["planned_depairport"]] = 1;
					else {
						airports[element["planned_depairport"]]++;
					}
				}
			}
		});
		$.each(airports, function (index, element) {
			airports_array.push({
				"name" : index,
				"val" : airports[index]
			});
		});
		airports_array.sort(function (a, b) {
			return b.val - a.val
		});
		var s = "Top 10 airports:\n\n";
		for (var i = 0; i < 10; i++) {
			if (i in airports_array) {
				s += airports_array[i].name + " (" + airports_array[i].val + ")" + "\n";
			}
		}
		alert(s);
	}
	$(document).ready(function () {
		initialize();
		$("#showTopAirports").click(function () {
			showTopAirports();
		});
		$("#cssearch").click(function () {
			searchForCallsign($('#search').val());
		});
	});
});
