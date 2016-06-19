"use strict";
if (typeof jQuery === "function")
	jQuery(function ($) {
		var App = function () {
			var map = null;
			var markersArray = [];
			var clients = [];
			var infowindow = null;
			var tmpMarkersArray = [];
			var defaultLocation = null;
			var zoom = 3;
			var getProp = function (obj, prop) {
				if (prop in obj)
					return obj[prop];
				return "";
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
				var deptime = getProp(obj, "planned_deptime");
				while (deptime.length < 4) {
					deptime = "0" + deptime;
				}
				return deptime.substring(0, 2) + ":" + deptime.substring(2, 4);
			}

			var tplPilot = function (client) {
				return {
					"Callsign" : getProp(client, "callsign"),
					"Real Name" : getProp(client, "realname"),
					"Altitude" : formatNumber((getProp(client, "altitude"))) + " ft",
					"Ground Speed" : getProp(client, "groundspeed") + " kts",
					"Aircraft" : getProp(client, "planned_aircraft"),
					"Tascruise" : getProp(client, "planned_tascruise") + " kts",
					"Depairport" : getProp(client, "planned_depairport"),
					"Planned Altitude" : getProp(client, "planned_altitude"),
					"Destairport" : getProp(client, "planned_destairport"),
					"Transponder" : getProp(client, "transponder"),
					"Planned Deptime" : formatDepTime(client, "planned_deptime"),
					"Altairport" : getProp(client, "planned_altairport"),
					"Remarks" : "<details>" + getProp(client, "planned_remarks") + "</details>",
					"Route" : "<details>" + getProp(client, "planned_route") + "</details>",
					"Logon" : formatDate(client, "time_logon"),
					"Heading" : getProp(client, "heading"),
					"QNH,iHg" : getProp(client, "QNH_iHg"),
					"QNH,Mb" : getProp(client, "QNH_Mb"),
					"Fuel on Board" : getProp(client, "planned_hrsfuel") + "h " + getProp(client, "planned_minfuel") + "m",
					"Enroute" : getProp(client, "planned_hrsenroute") + "h " + getProp(client, "planned_minenroute") + "m"
				}
			};
			var tplATC = function (client) {
				return {
					"Callsign" : getProp(client, "callsign"),
					"Real Name" : getProp(client, "realname"),
					"Frequency" : getProp(client, "frequency"),
					"Visual Range" : getProp(client, "visualrange"),
					"Atis Received" : formatDate(client, "time_last_atis_received"),
					"Logon" : formatDate(client, "time_logon"),
				}
			};
			var makeBoxInfo = function (client) {
				var obj = null;
				if (client.clienttype === "PILOT") {
					obj = tplPilot(client);
				}
				if (client.clienttype === "ATC") {
					obj = tplATC(client);
				}
				var title = "<table>";
				for (var key in obj) {
					if (obj.hasOwnProperty(key) && typeof obj[key] != "undefined" && obj[key] !== "") {
						title += "<tr><td>" + key + "</td><td><b>" + obj[key] + "</b></td></tr>";
					}
				}
				title += "</table>";
				title += "<br>";
				title += "<a href=\"http://vataware.com/pilot/" + client.cid + "\"" + " target=\"_blank\">Past flights (Vataware)</a>";
				return "<div class='info'>" + title + "</div>";
			}
			var openInfoWindow = function (content, map, marker) {
				infowindow.close();
				infowindow.vs_cid = clients[marker.client_array_id].cid;
				infowindow.setContent(content);
				infowindow.open(map, marker);
			};
			var loopFunction = function () {
				$.getJSON("/clients.json", function (data) {
					for (var i = 0; i < markersArray.length; i++) {
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
						if (client.clienttype === "PILOT") {
							icon = "/img/planes/" + (360 - client.heading + client.heading % 10) + ".png";
						}
						if (client.clienttype === "ATC") {
							icon = "/img/control.png";
						}
						if (client.clienttype === "PILOT" || client.clienttype === "ATC") {
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
					if (window != window.top) {
						$("#copyright").show();
					}
				});
			};
			this.initialize = function () {
				defaultLocation = new google.maps.LatLng(44.996883999209636, -18.800782187499979);
				if (('localStorage' in window) && window['localStorage'] != null) {
					if (localStorage.getItem('map_center_lat') && localStorage.getItem('map_center_lng')) {
						defaultLocation = new google.maps.LatLng(localStorage.getItem('map_center_lat'), localStorage.getItem('map_center_lng'));
					}
					if (localStorage.getItem('map_zoom')) {
						zoom = parseInt(localStorage.getItem('map_zoom'));
					}
				}
				infowindow = new google.maps.InfoWindow({
						maxWidth : 400
					});
				map = new google.maps.Map(document.getElementById("map_canvas"), {
						zoom : zoom,
						center : defaultLocation,
						mapTypeId : google.maps.MapTypeId.ROADMAP,
						streetViewControl: false
					});
				google.maps.event.addListener(infowindow, 'closeclick', function () {
					infowindow.vs_cid = -1;
					for (var i = 0; i < tmpMarkersArray.length; i++) {
						tmpMarkersArray[i].setMap(null);
					}
					tmpMarkersArray = [];
				});
				google.maps.event.addListener(map, 'click', function () {
					infowindow.vs_cid = -1;
					for (var i = 0; i < tmpMarkersArray.length; i++) {
						tmpMarkersArray[i].setMap(null);
					}
					tmpMarkersArray = [];
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
				setInterval(loopFunction, 60000*2);
				if (window != window.top) {
					$("#copyright").show();
				}
			};
			this.searchForCallsign = function (callsign) {
				callsign = $.trim(callsign.toUpperCase());
				for (var i = 0; i < markersArray.length; i++) {
					if (markersArray[i].callsign === callsign) {
						$(':focus').blur();
						setTimeout(function(){openInfoWindow(makeBoxInfo(clients[markersArray[i].client_array_id]), map, markersArray[i])}, 100);
						break;
					}
				}
			}
		};
		$(document).ready(function () {
			var app = new App();
			app.initialize();
			$("#cssearch").click(function () {
				app.searchForCallsign($('#search').val());
			});
		});
	});
