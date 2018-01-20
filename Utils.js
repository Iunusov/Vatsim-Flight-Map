"use strict";

// Utilities
class Utils{
	static constructor(){
		//
	}

	// Date formatting
	// YYYYMMDDHHmmSS => HH:MM:SS
	static formatDate(str) {

		// If there is no string or if it's invalid
		if (!str || str.length != 14 || !parseInt(str)) {
			return str; // Send that back!
		}
		return str.substring(8, 10) + ":" + str.substring(10, 12) + ":" + str.substring(12, 14);
	}

	// Number formatting
	// 34098 => 34,098
	static commaSeparateNumber(val) {
		if (!parseInt(val)) {
			return val;
		}
		return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	// Departure time formatting
	// 520 => 05:20
	static formatDepTime(str) {
		if (!parseInt(str)) {
			return str;
		}

		// If only 3 characters
		if(str.length == 3){
			// Add the 0 to the front
			str = "0" + str;
		}

		return str.substring(0, 2) + ":" + str.substring(2, 4);
	}
}
module.exports = Utils;