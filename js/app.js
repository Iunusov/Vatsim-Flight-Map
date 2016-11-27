"use strict";
if (typeof jQuery === "function") {
	jQuery(function ($) {
		var App = function () {
			var lastModified = null;
			var map = null;
			var markersArray = [];
			var clients = [];
			var infowindow = null;
			var tmpMarkersArray = [];
			var defaultLocation = null;
			var mapTypeId = null;
			var zoom = 3;
			var currentCallsign = "";
			this.getUrlParam = function (name, url) {
				if (!url)
					url = location.href;
				name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
				var regexS = "[\\?&]" + name + "=([^&#]*)";
				var regex = new RegExp(regexS);
				var results = regex.exec(url);
				return results == null ? null : results[1];
			}
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
					"Flight Type" : getFlightType(getProp(client, "planned_flighttype")),
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
					"Route" : "<details><code>" + getProp(client, "planned_route") + "</code></details>",
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
				title += "<tr><td>" + "Past flights" + "</td><td><b>" + "<a href=\"http://vataware.com/pilot/" + client.cid + "\"" + " target=\"_blank\">Vataware</a>" + "</b></td></tr>";
				title += "</table>";
				title += "<br>";
				title += "<a href=\"/?c=" + client.callsign + "\"" + " target=\"_blank\">Share link</a>";
				return "<div id='infoWindowContent'>" + title + "</div>";
			}
			var openInfoWindow = function (content, map, marker) {
				if (window && window.history && window.history.pushState) {
					var callSign = clients[marker.client_array_id].callsign;
					var realName = clients[marker.client_array_id].realname;
					if (callSign && realName) {
						history.replaceState({}, realName, "?c=" + callSign);
						document.title = realName;
					}
				}
				infowindow.close();
				infowindow.vs_cid = clients[marker.client_array_id].cid;
				infowindow.setContent(content);
				infowindow.open(map, marker);
				$("#searchrow").hide();
				$("#infoWindowContent").parent().parent().css("max-height", "9999px");
			};
			this.callSignsArray = [];
			this.loopFunction = function () {
				var dfd = $.Deferred();
				var that = this;
				$.ajax({
					type : "GET",
					url : "getclients.php",
					contentType : "application/json",
					dataType : "json",
					success : function (data, textStatus, request) {
						var lm = request.getResponseHeader('Last-Modified');
						if (lm != null && lm == lastModified) {
							return dfd.promise();
						}
						lastModified = lm;
						for (var i = 0; i < markersArray.length; i++) {
							if (infowindow.vs_cid === clients[markersArray[i].client_array_id].cid)
								tmpMarkersArray.push(markersArray[i]);
							else
								markersArray[i].setMap(null);
							google.maps.event.clearInstanceListeners(markersArray[i]);
						}
						clients = data;
						markersArray = [];
						that.callSignsArray = [];
						$.each(data, function (index, client) {
							that.callSignsArray.push(client.callsign);
							var icon = "img/undefined.png";
							if (!client.heading)
								client.heading = 0;
							if (client.clienttype === "PILOT") {
								icon = "img/planes/" + (360 - Math.round(client.heading / 20) * 20) + ".png";
							}
							if (client.clienttype === "ATC") {
								icon = "img/control.png";
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
						$('#search').autocomplete("option", {
							source : that.callSignsArray
						});
						dfd.resolve();
					}
				});
				return dfd.promise();
			};
			var onCloseInfoWindow = function () {
				$("#searchrow").show();
				infowindow.vs_cid = -1;
				for (var i = 0; i < tmpMarkersArray.length; i++) {
					tmpMarkersArray[i].setMap(null);
				}
				tmpMarkersArray = [];
				history.replaceState({}, "state", "/");
			}
			this.initialize = function () {
				defaultLocation = new google.maps.LatLng(44.996883999209636, -18.800782187499979);
				mapTypeId = google.maps.MapTypeId.TERRAIN;
				if (('localStorage' in window) && window['localStorage'] != null) {
					if (localStorage.getItem('map_center_lat') && localStorage.getItem('map_center_lng')) {
						defaultLocation = new google.maps.LatLng(localStorage.getItem('map_center_lat'), localStorage.getItem('map_center_lng'));
					}
					if (localStorage.getItem('map_zoom')) {
						zoom = parseInt(localStorage.getItem('map_zoom'));
					}
					if (localStorage.getItem('map_type')) {
						mapTypeId = localStorage.getItem('map_type');
					}
					if (localStorage.getItem('currentCallsign')) {
						$("#search").val(localStorage.getItem('currentCallsign'));
					}
				}
				infowindow = new google.maps.InfoWindow({
						maxWidth : 400
					});
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
					onCloseInfoWindow();
				});
				google.maps.event.addListener(map, 'click', function () {
					onCloseInfoWindow();
					infowindow.close();
				});
				window.onbeforeunload = function (e) {
					if (('localStorage' in window) && window['localStorage'] != null) {
						localStorage.setItem('map_center_lat', map.getCenter().lat());
						localStorage.setItem('map_center_lng', map.getCenter().lng());
						localStorage.setItem('map_zoom', map.zoom);
						localStorage.setItem('map_type', map.getMapTypeId());
						localStorage.setItem('currentCallsign', currentCallsign);
					}
				};
				setInterval(this.loopFunction, 60000 * 2);
			};
			this.searchForCallsign = function (callsign) {
				currentCallsign = callsign;
				callsign = $.trim(callsign.toUpperCase());
				for (var i = 0; i < markersArray.length; i++) {
					if (markersArray[i].callsign === callsign) {
						openInfoWindow(makeBoxInfo(clients[markersArray[i].client_array_id]), map, markersArray[i]);
						break;
					}
				}
			}
		};
		$(document).ready(function () {
			var app = new App();
			app.initialize();
			$("#search").autocomplete({
				source : [],
				open : function (result) {
					if (navigator.userAgent.match(/(iPod|iPhone|iPad)/)) {
						$('.ui-autocomplete').off('menufocus hover mouseover');
					}
				},
				select : function (event, ui) {
					setTimeout(function () {
						document.activeElement.blur();
						$('#cssearch').click();
					}, 200);
				}
			});
			app.loopFunction().then(function () {
				var callSign = app.getUrlParam("c", document.URL);
				if (callSign) {
					app.searchForCallsign(callSign);
				}
			});
			$("#cssearch").click(function () {
				setTimeout(function () {
					app.searchForCallsign($('#search').val());
				}, 200);
			});
		});
	});
}
