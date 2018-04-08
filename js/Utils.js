"use strict";
var Utils = function () {
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
}
module.exports = Utils;
