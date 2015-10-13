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
	var result = Object.create(wsPins);
	result.Pins = Pins;
	result.settings = settings;
	result.configure();
	return result;
}

var wsPins = {
	Pins: null,
	settings: null,
	wss: null,
	open: false,
	configure: function() {
		var wss = this.wss = new WebSocketServer(("port" in this.settings) ? this.settings.port : undefined);
		wss.onlaunch = function() {
			this.repeats = [];
		}
		wss.onconnect = function(ws, options) {
			wss.open = true;

			ws.onopen = function() {
			}
			ws.onclose = function() {
				//@@ needs to check for repeats on this instance only!!
				wss.repeats.every(function(item) {
					item.repeat.close();
				});
				wss.repeats.length = 0;
			}
			ws.onerror = function() {
//@@ report to client that this connection was dropped
				// onclose will be called next, so no clean-up here
			}
			ws.onmessage = function(e) {
				var request = JSON.parse(e.data);
				if ("repeat" in request) {
					if (request.repeat) {
						var repeat = Pins.repeat(request.path, ("interval" in request) ? parseInt(request.interval) : request.timer, function(result) {
							if ((typeof result === "object") && (result instanceof Chunk)) {
								ws.send(JSON.stringify({inReplyTo: request.id, binary: true}));
								ws.send(result);
							}
							else
								ws.send(JSON.stringify({inReplyTo: request.id, body: result}));
						});
						wss.repeats.push({repeat: repeat, request: request});
					}
					else {
						wss.repeats.every(function(item, index) {
							if (item.request.id !== request.id) return true;		//@@ not enough to compare request.id - need something connection specific.
							item.repeat.close();
							wss.repeats.splice(index, 1);
						});
					}
				}
				else {
					Pins.invoke(request.path, ("requestObject" in request) ? request.requestObject : undefined, function(result) {
						if ((typeof result === "object") && (result instanceof Chunk)) {
							ws.send(JSON.stringify({inReplyTo: request.id, binary: true}));
							ws.send(result);
						}
						else
							ws.send(JSON.stringify({inReplyTo: request.id, body: result}));
					});
				}
			}
		}
	},
	close: function(callback) {
		wss.open = false;		//@@ close all connections. cancel repeats.
	},
	get port() {
		return this.wss.port;
	},
	get url() {
		return "ws://*:" + this.wss.port + "/";
	}
};
