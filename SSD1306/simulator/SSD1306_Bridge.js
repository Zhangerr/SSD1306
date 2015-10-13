// KPR Script file
//Simulator limitations: crashes if too many pixels it needs to draw, anything that requires hardware commands besides rendering doesn't work, e.g scrolling and inverting
var display;
var DISPLAY = require('SSD1306')
var BLACK = 0;
var WHITE = 1;
var INVERSE = 2;
var SSD1306_SWITCHCAPVCC = 0x2;
var PinsSimulators = require ("PinsSimulators");
exports.pins = {
    data: {
        type: "I2C",
        address: 0x3c
    },
    resetpin: {
        type: "Digital",
        direction: "output"
    }
}


exports.configure = function (configuration) {
	var DisplayBehavior = function(column, data) {
		Behavior.call(this, column, data);
	}
	var portDisplay = new Port({width:configuration.width, height:configuration.height, behavior: Behavior({
			onDraw: function(port) {
				port.fillColor("black",0,0,configuration.width, configuration.height);
				if (display) {
					for (var i = 0; i < display.buffer.length; i++) {
						var byte = display.buffer[i];
						for (var j = 0; j < 8; j++) {
							if (byte & (1 << j)) {
								var x = i % configuration.width;
								var y = Math.floor( i / configuration.width) * 8 + j;
						//		trace("filling " + x + "," + y+ "\n");
								port.fillColor("white", x, y, 1, 1);
							}
						}
					}
				}
			}
		})});
	
	DisplayBehavior.prototype = Object.create(Behavior.prototype, {
		onCreate: {
			value: function(column, data) {
			column.partContentsContainer.add(portDisplay);
		}}
		}
	);
	this.data = {
		id: 'DISPLAY',
		behavior: DisplayBehavior,
		header: {
			label: this.id,
			name : "Display", 
        	iconVariant : PinsSimulators.SENSOR_KNOB 
		},
	}
	this.container = shell.delegate("addSimulatorPart", this.data);
	trace("Configuring pins...\n");
    display = Object.create(DISPLAY.SSD1306);
    display.setup(this.data, this.resetpin, configuration.width, configuration.height, portDisplay);
    
    //bind each "non-private" method to exports so that they can work through message passing the array of arguments (need a lambda to delegate it)
    for (var method in display) {
    	if (typeof display[method] === "function" && !("private" in display[method])) {
    		//trace(method+"\n");
    		exports[method] = (function (i) { return function(params) {
    			return display[i].apply(display, params);
    		}})(method)
    	} 
    }   
}
