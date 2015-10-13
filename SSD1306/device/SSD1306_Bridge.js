//@module
// KPR Script file

var display;
var DISPLAY = require('SSD1306')

var BLACK = 0;
var WHITE = 1;
var INVERSE = 2;
var SSD1306_SWITCHCAPVCC = 0x2;
exports.pins = {
    data: {
        type: "I2C",
        address: null //must be set to something otherwise errors for some reason
    },
    resetpin: {
        type: "Digital",
        direction: "output"
    }
}

exports.configure = function (configuration) {
	trace("Height: " + configuration.height + "\n");
	trace("Configuring pins...\n");
	this.data.address = (configuration.height === 32? 0x3c: 0x3d);
    this.data.init();
    this.resetpin.init();
    display = Object.create(DISPLAY.SSD1306);
    display.setup(this.data, this.resetpin, configuration.width, configuration.height);
    //bind each "non-private" method to exports so that they can work through message passing the array of arguments (need a lambda to delegate it)
    for (var method in display) {
    	if (typeof display[method] === "function" && !("private" in display[method])) {
    	//this trace generates the array for application side object population
    	//	trace('"' + method+"\", ");
    		exports[method] = (function (i) { return function(params) {
    			return display[i].apply(display, params);
    		}})(method)
    	} 
    }
   
}