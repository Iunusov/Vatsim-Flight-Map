"use strict";
var _ = require('underscore');
var Utils = function () {
    var that = this;
    //20170104045956 => 04:59:56
    this.formatDate = function (str) {
        if (!str || str.length != 14 || !parseInt(str)) {
            return str;
        }
        return str.substring(8, 10) + ":" + str.substring(10, 12) + ":" + str.substring(12, 14);
    }
    //34098 => 34,098
    this.commaSeparateNumber = function (val) {
        if (!parseInt(val)) {
            return val;
        }
        while (/(\d+)(\d{3})/.test(val.toString())) {
            val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
        }
        return val;
    }
    //520 => 05:20
    this.formatDepTime = function (str) {
        if (!parseInt(str)) {
            return str;
        }
        while (str.length < 4) {
            str = "0" + str;
        }
        return str.substring(0, 2) + ":" + str.substring(2, 4);
    }
    this.parseClientDetails = function (client) {
        client["cid"] = parseInt(client["cid"]);
        client["planned_depairport_lat"] = parseFloat(client["planned_depairport_lat"]);
        client["planned_depairport_lon"] = parseFloat(client["planned_depairport_lon"]);
        client["latitude"] = parseFloat(client["latitude"]);
        client["longitude"] = parseFloat(client["longitude"]);
        client["planned_destairport_lat"] = parseFloat(client["planned_destairport_lat"]);
        client["planned_destairport_lon"] = parseFloat(client["planned_destairport_lon"]);
        return client;
    }
    var clientTemplate = _.template(require("../tpl/details.html"));
    this.objectToHTML = function (src) {
        var client = $.extend({}, src);
        client["altitude"] = that.commaSeparateNumber(client["altitude"]);
        if (client.clienttype === "PILOT") {
            client["planned_deptime"] = that.formatDepTime(client["planned_deptime"]);
            client["planned_actdeptime"] = that.formatDepTime(client["planned_actdeptime"]);
        } else
            if (client.clienttype === "ATC") {
                client["time_last_atis_received"] = that.formatDate(client["time_last_atis_received"]);
            }
        return clientTemplate({
            "client": client
        });
    }
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

    //The numbers are in decimal degrees format and range from -90 to 90 for latitude and -180 to 180 for longitude.
    this.validateLngLat = function (lng, lat) {
        if (lat > 90 || lat < -90) {
            return false;
        }
        if (lng > 180 || lng < -180) {
            return false;
        }
        return true;
    }
}
module.exports = Utils;
