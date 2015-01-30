jQuery(function () {
	var map;
	var markersArray = [];
	var clients = [];
	var infowindow = new google.maps.InfoWindow({
			maxWidth : 200
		});
	var tmpMarkersArray = [];
	var initLocation = new google.maps.LatLng(48.35719, 14.55371);
	var defaultLocation = new google.maps.LatLng(initLocation.lat(), initLocation.lng());
	if (('localStorage' in window) && window['localStorage'] != null)
		if (localStorage.getItem('map_center_lat') && localStorage.getItem('map_center_lng')) {
			defaultLocation = new google.maps.LatLng(localStorage.getItem('map_center_lat'), localStorage.getItem('map_center_lng'));
		}
	function initialize() {
		if (defaultLocation.lat() == initLocation.lat() && defaultLocation.lng() == initLocation.lng()) {
			if (navigator.geolocation) {
				browserSupportFlag = true;
				navigator.geolocation.getCurrentPosition(function (position) {
					map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
				}, function () {});
			};
		}
		map = new google.maps.Map(document.getElementById("map_canvas"), {
				zoom : 4,
				center : defaultLocation,
				mapTypeId : google.maps.MapTypeId.ROADMAP
			});
		google.maps.event.addListener(infowindow, 'closeclick', function () {
			infowindow.vs_cid = -1;
			for (i in tmpMarkersArray) {
				tmpMarkersArray[i].setMap(null);
			}
			tmpMarkersArray = [];
		});
		if (('localStorage' in window) && window['localStorage'] != null)
			google.maps.event.addListener(map, 'drag', function () {
				localStorage.setItem('map_center_lat', map.getCenter().lat());
				localStorage.setItem('map_center_lng', map.getCenter().lng());
			});
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
					icon = "/plane/cache/" + (360 - client.heading + client.heading % 10) + ".png";
				}
				if (client.clienttype == "ATC") {
					icon = "/img/control.png";
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
	function makeBoxInfo(client) {
		var title = "";
		title += "<b>past flights:</b> <a target=\"_blank\"href=\"http://www.vataware.com/pilot.cfm?cid=" + client["cid"] + "\">vataware</a><br>";
		for (var key in client) {
			if ($.inArray(key, ["cid", "clienttype", "latitude", "longitude"]) == -1) {
				if (key == "planned_route" || key == "planned_remarks") {
					title += "<details><summary><b>" + key + ": " + "</b><br></summary>" + client[key] + "</details>";
				} else {
					title += "<b>" + key + ": </b>" + client[key] + "<br>";
				}
			}
		}
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
		$.getJSON("/clients.json?" + Math.random(), function (data) {
			$.each(data, function (index, element) {
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
				s += airports_array[i].name + " (" + airports_array[i].val + ")" + "\n";
			}
			alert(s);
		});
	}
	initialize();
	$("#showTopAirports").click(function () {
		showTopAirports();
	});
	$("#cssearch").click(function () {
		searchForCallsign($('#search').val());
	});
});
