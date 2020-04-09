"use strict";
var _ = require('underscore');
var Utils = require("./Utils.js");
var PolyLine = require("./PolyLine.js");
var App = function (conf, map_) {
    var document_title = document.title;
    var utils = new Utils();
    var polyLine = new PolyLine();
    var that = this;
    var map = map_;
    var pTimeout = false;
    var timeStamp = null;
    var markersArray = [];
    var infowindow = new mapboxgl.Popup({
            maxWidth: "500px"
        });
    this.getMap = function () {
        return map;
    }
    this.callSignsArray = [];
    this.openInfoWindow = function (longitude, latitude, client) {
        polyLine.clear(map, "route");
        infowindow.setLngLat([longitude, latitude]).setHTML(utils.objectToHTML(client)).addTo(map);
        that.onOpenInfoWindow(client);
        if (client.clienttype === "PILOT" && !isNaN(client["planned_destairport_lat"]) && !isNaN(client["planned_destairport_lon"]) && !isNaN(client["planned_depairport_lat"]) && !isNaN(client["planned_depairport_lon"])) {
            polyLine.draw(map, "route", [[client.planned_depairport_lon, client.planned_depairport_lat], [client.planned_destairport_lon, client.planned_destairport_lat]]);
        }
    };
    infowindow.on('close', function (e) {
        polyLine.clear(map, "route");
        that.onCloseInfoWindow();
    });
    this.requestClientDetails = function (cid, callsign, cb) {
        $.ajax({
            timeout: 5000,
            type: "GET",
            url: "api/getcdetails.php",
            data: {
                "cid": cid,
                "callsign": callsign,
                "ts": timeStamp
            },
            contentType: "application/json",
            dataType: "json",
            success: function (client, textStatus, request) {
                cb(utils.parseClientDetails(client));
            }
        });
    }
    this.onOpenInfoWindow = function () {};
    this.onCloseInfoWindow = function () {};
    this.onReceiveClientsArray = function () {};
    this.getClientsFromServer = function () {
        var dfd = $.Deferred();
        $.ajax({
            timeout: 5000,
            type: "GET",
            url: "api/getclients.php",
            contentType: "application/json",
            dataType: "json",
            success: function (result, textStatus, request) {
                var ts = result.timestamp;
                console.log(ts);
                if (ts && ts === timeStamp) {
                    dfd.resolve();
                    return;
                }
                timeStamp = ts;
                for (var i = 0; i < markersArray.length; i++) {
                    markersArray[i].remove();
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
                    if (!utils.validateLngLat(longitude, latitude)) {
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
                        var el = document.createElement('div');
                        el.className = 'marker';
                        el.style.backgroundImage = 'url(' + icon + ')';
                        el.setAttribute('data-lt', longitude);
                        el.setAttribute('data-lg', latitude);
                        el.setAttribute('data-cid', cid);
                        el.setAttribute('data-callsign', callsign);
                        var marker = new mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map);
                        marker["vatsim_cid"] = cid;
                        marker["vatsim_callsign"] = callsign;
                        markersArray.push(marker);
                    }
                });
                if (result["online"]) {
                    document.title = document_title + " (" + result.online.toString() + " online)";
                }
                that.onReceiveClientsArray(that.callSignsArray);
                dfd.resolve();
            },
            error: function () {
                dfd.reject();
            }
        });
        return dfd.promise();
    };
    this.startPolling = function (success_cb) {
        (that.getClientsFromServer()).done(function () {
            if (success_cb) {
                success_cb();
            }
        }).always(function () {
            if (pTimeout) {
                clearTimeout(pTimeout);
                pTimeout = false;
            }
            pTimeout = setTimeout(that.startPolling, 60 * 1000);
        });
    }
    this.searchForCallsign = function (callsign) {
        callsign = $.trim(callsign.toUpperCase());
        for (var i = 0; i < markersArray.length; i++) {
            var current_calsign = markersArray[i].vatsim_callsign.toUpperCase();
            var cid = markersArray[i].vatsim_cid; ;
            if (current_calsign === callsign) {
                that.requestClientDetails(cid, callsign, function (clientDetails) {
                    var coords = markersArray[i].getLngLat();
                    map.flyTo({
                        center: coords
                    });
                    that.openInfoWindow(coords.lng, coords.lat, clientDetails, markersArray[i]);
                });
                break;
            }
        }
    }
};
module.exports = App;
