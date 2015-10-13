//@module
/*
 *     Copyright (C) 2002-2015 Kinoma, Inc.
 *
 *     All rights reserved.
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

exports.instantiate = function(Pins, settings)
{
	var result = Object.create(localPins);
	result.Pins = Pins;
	result.settings = settings;
	result.configure();
	return result;
}

var localPins = {
	Pins: null,
	settings: null,
	configure: function() {
	},
	invoke: function(path, requestObject, callback) {
		this.Pins.invoke(null, path, requestObject, callback);
	},
	repeat: function(path, requestObject, condition, callback) {
		this.Pins.repeat(path, requestObject, condition, callback);
	},
	close: function(callback) {
		this.Pins.close(callback);
	}
};
