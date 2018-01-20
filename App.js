"use strict";

// Import the utils
let Utils = require("./Utils.js");

// Application class
class App{
	constructor(){

		// Map vars
		this.map = false;
		this.defaultLocation = null;
		this.mapTypeId = null;
		this.zoom = 3;

		// VATSIM user stuff
		this.markersArray = [];
		this.tmpMarkersArray = [];
		this.infowindow = new google.maps.InfoWindow({});
		this.polyLine = null;
		this.clientTemplate = _.template(require("raw-loader!../tpl/details.html"));
		this.callSignsArray = [];

		// Other
		this.pTimeout = false;
		this.lastModified = "";
		this.utils = new Utils();
	}

	// Turn JS object into HTML
	objectToHTML (client) {

		// Format altitude
		client["altitude"] = this.utils.commaSeparateNumber(client["altitude"]);

		// Logon time
		client["time_logon"] = client["time_online"];

		// If pilot
		if (client.clienttype === "PILOT") {

			// Get Dep times
			client["planned_deptime"] = this.utils.formatDepTime(client["planned_deptime"]);
			client["planned_actdeptime"] = this.utils.formatDepTime(client["planned_actdeptime"]);
		} else if (client.clienttype === "ATC") {
			// If ATC

			// Get the last ATIS time
			client["time_last_atis_received"] = this.utils.formatDate(client["time_last_atis_received"]);
		}

		// Return the client
		return clientTemplate({
			client : client
		});
	}

	// Marker event listener
	markerClickListener() {
		var marker = this;

		// Get the client details
		requestClientDetails(marker.vatsim_callsign, function (clientDetails) {

			// Show the info window
			openInfoWindow(clientDetails, this.map, marker);
		});
	}

	// Open an infowindow
	openInfoWindow (client, map, marker) {

		// If there are polylines
		if (this.polyLine) {

			// Remove em'
			this.polyLine.setMap(null);
		}

		// Close any info windows
		closeInfoWindow();

		// Assign the new data
		this.infowindow.vatsim_cid = client.cid;
		this.infowindow.setContent(objectToHTML(client));
		this.infowindow.open(this.map, marker);

		// Show the window
		if (client.clienttype === "PILOT" &&
			parseFloat(client["planned_destairport_lat"]) &&
			parseFloat(client["planned_destairport_lon"]) &&
			parseFloat(client["planned_depairport_lat"]) &&
			parseFloat(client["planned_depairport_lon"]))
		{
			this.polyLine = new google.maps.Polyline({
				path : [
					new google.maps.LatLng(
						client.planned_depairport_lat,
						client.planned_depairport_lon
					),
					new google.maps.LatLng(
						client.latitude,
						client.longitude
					),
					new google.maps.LatLng(
						client.planned_destairport_lat,
						client.planned_destairport_lon
					)
				],
				strokeColor : "#FF0000",
				strokeOpacity : 0.8,
				strokeWeight : 2,
				geodesic : true,
				map : map
			});
		}

		// Open window event
		this.onOpenInfoWindow(client);
	};
	

	// Close infowindow
	closeInfoWindow () {

		// Close the infowindow
		this.infowindow.close();

		// Remove the content
		this.infowindow.setContent("");
		this.infowindow.vatsim_cid = -1;

		// If there is a polyline
		if (this.polyLine) {

			// Remove it
			this.polyLine.setMap(null);
		}

		// Loop through the temp markers
		for (var i = 0; i < this.tmpMarkersArray.length; i++) {

			// Remove em' all! (from the map...)
			this.tmpMarkersArray[i].setMap(null);
		}

		// Remove em' all! (for real this time)
		this.tmpMarkersArray = [];

		// Close window event
		this..onCloseInfoWindow();
	}
	
	// Get client details
	requestClientDetails (callsign, cb) {

		// Ajax requres to get details PHP
		$.ajax({
			type : "GET",
			url : "getcdetails.php",
			data : {
				callsign : callsign
			},
			contentType : "application/json",
			dataType : "json",
			success : function (data) {

				// Run callback function with data
				cb(data);
			}
		});
	}
	
	// Events
	onOpenInfoWindow() {};
	onCloseInfoWindow() {};
	onReceiveClientsArray() {};

	// no idea what this does
	getUrlParam (name, url) {
		if (!url) {
			url = location.href;
		}
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regexS = "[\\?&]" + name + "=([^&#]*)";
		var regex = new RegExp(regexS);
		var results = regex.exec(url);
		return results == null ? null : results[1];
	}

	// Get the VATSIM clients
	getClientsFromServer () {
		// I dont understand promises...
		var dfd = $.Deferred();

		// Ajax request to clients PHP stuff
		$.ajax({
			type : "GET",
			url : "getclients.php",
			contentType : "application/json",
			dataType : "json",
			success : function (data, textStatus, request) {

				// Dunno what this does
				var lm = request.getResponseHeader('Last-Modified');
				if (lm && lm == lastModified) {
					dfd.resolve();
					return dfd.promise();
				}
				lastModified = lm;

				// Loop through the markers
				for (var i = 0; i < _this.markersArray.length; i++) {

					// If there is an info window open
					if (_this.infowindow.vatsim_cid === _this.markersArray[i].vatsim_cid) {

						// Move that marker to a temp array
						_this.tmpMarkersArray.push(_this.markersArray[i]);
					} else {

						// Remove the markers from the map and everything
						google.maps.event.clearInstanceListeners(_this.markersArray[i]);
						_this.markersArray[i].setMap(null);
						delete _this.markersArray[i];
					}
				}

				// Clear the marker array
				_this.markersArray = [];
				_this.callSignsArray = [];

				// Loop through the data from VATSIM
				$.each(data, function (index, client) {
					var cid = client[0];
					var callsign = client[1];
					var clienttype = client[2];
					var heading = client[3];
					var latitude = client[4];
					var longitude = client[5];
					_this.callSignsArray.push(callsign);

					// Determine an icon
					var icon = "img/undefined.png";
					if (!heading)
						heading = 0;
					if (clienttype === "PILOT") {
						icon = "img/planes/" + (360 - Math.round(heading / 20) * 20) + ".png";
					}
					if (clienttype === "ATC") {
						icon = "img/control.png";
					}

					// Create the marker
					if (clienttype === "PILOT" || clienttype === "ATC") {
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(
								latitude,
								longitude
							),
							map: _this.map,
							title: callsign,
							icon: icon,
							vatsim_cid: client[0],
							vatsim_callsign: client[1]
						})

						// Add to map
						marker.setMap(_this.map);

						// Assign the listner
						google.maps.event.addListener(marker, 'click', markerClickListener);

						// Add to the marker array
						_this.markersArray.push(marker);
					}
				});

				// Event trigger
				_this.onReceiveClientsArray(_this.callSignsArray);
				dfd.resolve();
			}
		});
		return dfd.promise();
	};

	// Timer / refresh trigger
	doPoll () {
		if (this.pTimeout) {
			clearTimeout(this.pTimeout);
			this.pTimeout = false;
		}
		var res = this.getClientsFromServer();
		pTimeout = setTimeout(this.doPoll, (60 * 1000) * 2); // Update every 2 mins (That's the fastest VATSIM goes)
		return res;
	}

	// Init map
	initialize (conf) {

		// Get the info from the config
		this.zoom = parseInt(conf['map_zoom']) || this.zoom;
		this.defaultLocation = new google.maps.LatLng(
			parseFloat(conf['map_center_lat']) || 44.996883999209636,
			parseFloat(conf['map_center_lng']) || -18.800782187499979
		);
		this.mapTypeId = _.contains(google.maps.MapTypeId, conf['map_type']) ? conf['map_type'] : google.maps.MapTypeId.TERRAIN;
		
		// THE map
		this.map = new google.maps.Map(document.getElementById("map_canvas"), {
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

		// Map listeners
		google.maps.event.addListener(this.infowindow, 'closeclick', function () {
			closeInfoWindow();
		});
		google.maps.event.addListener(this.map, 'click', function () {
			closeInfoWindow();
		});
	};

	// Callsign search
	searchForCallsign (callsign) {

		// Clean the input
		callsign = $.trim(callsign.toUpperCase());

		// Loop through markers
		for (var i = 0; i < this.markersArray.length; i++) {

			// Assign the callsign
			var current_calsign = this.markersArray[i].vatsim_callsign.toUpperCase();

			// Do we have a match?
			if (current_calsign === callsign) {

				// Get the details
				requestClientDetails(callsign, function (clientDetails) {
					openInfoWindow(clientDetails, this.map, this.markersArray[i]);
				});
				break;
			}
		}
	}
};
module.exports = App;
