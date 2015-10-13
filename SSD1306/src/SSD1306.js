//@module
//BLL for the SSD1306 128x32 OLED Display - http://www.adafruit.com/products/931
//Adapted from https://github.com/adafruit/Adafruit_SSD1306/blob/master/Adafruit_SSD1306.cpp

//only supports 128x32 and 128x64 right now, but I've made it so that the code can be easily modified to new screen sizes

var GRAPHICS = require('Graphics')
var TIME = false;
var Pins = require("pins");

//alternative, declare these properties in descriptor object for object.create?
var SSD1306 = Object.create(GRAPHICS.Graphics);
var VLINE_PREMASK = [0x00, 0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE];
var VLINE_POSTMASK = [0x00, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F];
SSD1306.setup = function(width, height, callback) {
	trace("setting up\n");
    this.init(width, height);
    this.setTextColor(WHITE);
    this.buffer = new Chunk(width*height/8);
    Pins.configure({
		display: {
                require: "SSD1306_Bridge",
                pins: {
                    data: {sda: 27, clock: 29},
                    resetpin: {pin:21}
                },
                width: width,
                height: height
            }
		}, function(success) {
			trace("configuration: " + success + "\n");
			if (success) {
				callback()
			}
	});
}

//es6 this can be avoided with the Proxy object and just sending whatever was passed to the get; however the caveat is that more mistakes may result since typos won't be caught; with this method you have to manually update the methods but non-existent methods will still error
function populateProxy() {
var commands = ["begin", "stopscroll", "startscrolldiagleft", "startscrolldiagright", "startscrollleft", "startscrollright", "invertDisplay"];
	for (var i = 0; i < commands.length; i++) {
		SSD1306[commands[i]] = (function(name){
			return function() {
				//convert arguments to a real array; alternative is using Array.prototype.slice on the pseudo array like object
				var args = new Array(arguments.length);
				for (var x = 0; x < arguments.length;x++) {
					args[x] = arguments[x];
				}
				Pins.invoke("/display/" + name, args);
				trace(name + " called with these args: " + JSON.stringify(args) + "\n");
			}
		})(commands[i]);
	}
}

//populates the SSD1306 object with methods that allow interfacing with the BLL
populateProxy();

SSD1306.display = function() {
	Pins.invoke("/display/display", [this.buffer]);
}

SSD1306.drawFastHLine = function(x, y, w, color) {
    switch (this.rotation) {
        case 0:
            // 0 degree rotation, do nothing
            this.drawFastHLineInternal(x, y, w, color);
            break;
        case 1:
            this.drawFastVLineInternal(this.WIDTH - y - 1, x, w, color);
            break;
        case 2:
            this.drawFastHLineInternal((this.WIDTH - x - 1) - (w-1), this.HEIGHT - y - 1, w, color);
            break;
        case 3:
            this.drawFastVLineInternal(y, (this.HEIGHT - x - 1) - (w-1), w, color);
            break;
    }
}


SSD1306.drawFastHLineInternal = function(x, y, w, color) {
    if (y < 0 || y >= this.HEIGHT) {
        return;
    }
    if (x < 0) {
        w += x;
        x = 0;
    }
    // make sure we don't go off the edge of the display
    if ((x + w) > this.WIDTH) {
        w = (this.WIDTH - x);
    }

    // if our width is now negative, punt
    if (w <= 0) {
        return;
    }
    var pBuf = 0;
    pBuf += ((y >> 3) * this.WIDTH);
    pBuf += x;
    pBuf = Math.floor(pBuf);
    var mask = 1 << (y & 7);
    switch (color) {
        case WHITE:
            while (w--) {
                this.buffer[pBuf] |= mask;
                pBuf++;
            }
            break;
        case BLACK:
            mask = ~mask;
            while (w--) {
                this.buffer[pBuf] &= mask;
                pBuf++;
            }
            break;
        case INVERSE:
            while (w--) {
                this.buffer[pBuf] ^= mask;
                pBuf++;
            }
            break;
    }
}
SSD1306.drawFastVLine = function(x, y, h, color) {
   // var bSwap = false;
    switch (this.rotation) {
        case 0:
        	this.drawFastVLineInternal(x, y, h, color);
            break;
        case 1:
            // 90 degree rotation, swap x & y for rotation, then invert x and adjust x for h (now to become w)
            this.drawFastHLineInternal((this.WIDTH - y - 1) - (h-1), x, h, color);
            break;
        case 2:
            // 180 degree rotation, invert x and y - then shift y around for height.
            this.drawFastVLineInternal(this.WIDTH - x - 1, (this.HEIGHT - y - 1) - (h-1), h, color);
            break;
        case 3:
            // 270 degree rotation, swap x & y for rotation, then invert y 
            this.drawFastHLineInternal(y, this.HEIGHT - x - 1, h, color);
            break;
    }
}

SSD1306.drawFastVLineInternal = function(x, __y, __h, color) {
    // do nothing if we're off the left or right side of the screen
    if (x < 0 || x >= this.WIDTH) {
        return;
    }

    // make sure we don't try to draw below 0
    if (__y < 0) {
        // __y is negative, this will subtract enough from __h to account for __y being 0
        __h += __y;
        __y = 0;
    }

    // make sure we don't go past the height of the display
    if ((__y + __h) > this.HEIGHT) {
        __h = (this.HEIGHT - __y);
    }

    // if our height is now negative, punt 
    if (__h <= 0) {
        return;
    }
    var y = __y;
    var h = __h;
    var pBuf = 0;
    var buffer = this.buffer;
    pBuf += ((y >> 3) * this.WIDTH);
    pBuf += x;
    var mod = y & 7;
    if (mod) {
        mod = 8 - mod;
        var mask = VLINE_PREMASK[mod];
        if (h < mod) {
            mask &= (0xFF >> (mod - h));
        }
        switch (color) {
            case WHITE:
                buffer[pBuf] |= mask;
                break;
            case BLACK:
                buffer[pBuf] &= ~mask;
                break;
            case INVERSE:
                buffer[pBuf] ^= mask;
                break;
        }
        if (h < mod) {
            return;
        }
        h -= mod;
        pBuf += this.WIDTH;
    }
    if (h >= 8) {
        if (color == INVERSE) {
            do {
                buffer[pBuf] = ~buffer[pBuf];
                pBuf += this.WIDTH;
                h -= 8;
            } while (h >= 8);
        } else {
            var val = (color == WHITE) ? 255 : 0;
            do {
                buffer[pBuf] = val;
                pBuf += this.WIDTH;
                h -= 8;
            } while (h >= 8);
        }
    }
    if (h) {
        mod = h & 7;
        
        var mask = VLINE_POSTMASK[mod];
        switch (color) {
            case WHITE:
                buffer[pBuf] |= mask;
                break;
            case BLACK:
                buffer[pBuf] &= ~mask;
                break;
            case INVERSE:
                buffer[pBuf] ^= mask;
                break;
        }
    }
}


SSD1306.clearDisplay = function() {
    for (var i = 0; i < this.WIDTH * this.HEIGHT / 8; i++) {
        this.buffer[i] = 0;
    }
}
SSD1306.drawPixel = function(x, y, color) {
    if ((x < 0) || (x >= this.width()) || (y < 0) || (y >= this.height()))
        return;
	//not optimizing into three separate drawPixel since setRotation is in Graphics and overwriting to duplicate this function three times seems unelegant anyway for literally marginal performance gains; writing the i2c data is still the main problem
    switch (this.rotation) {
        case 1:
            var temp = x;
            x = y;
            y = temp;
            x = this.WIDTH - x - 1;
            break;
        case 2:
            x = this.WIDTH - x - 1;
            y = this.HEIGHT - y - 1;
            break;
        case 3:
            var temp = x;
            x = y;
            y = temp;
            y = this.HEIGHT - y - 1;
            break;
    }
    //Math.floor is key -> forgot that division usually converts to float in javascript so was getting buffer overflows since it wouldn't floor the division
    //trying it in c++ was a good idea, data sheet probably useful, should probably figure out the bit manipulation below to understand binary representation
    //512 byte buffer because you only need 1 bit for each pixel and each byte has 8 bits=> 128*32 = 4096 = 8 * 512
    //each byte represents 8 pixels
    var value = (x | 0) + (y >> 3) * this.WIDTH;
    switch (color) {
        case WHITE:
            this.buffer[value] |= (1 << (y & 7));
            break;
        case BLACK:
            this.buffer[value] &= ~(1 << (y & 7));
            break;
        case INVERSE:
            this.buffer[value] ^= (1 << (y & 7));
            break;
    }
}
var BLACK = 0;
var WHITE = 1;
var INVERSE = 2;

exports.SSD1306 = SSD1306;