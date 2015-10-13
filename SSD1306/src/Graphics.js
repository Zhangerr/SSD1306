//@module
//Javascript port of the Adafruit Graphics library: https://github.com/adafruit/Adafruit-GFX-Library
//Some setter/getter methods might not be implemented, just access the properties
//Make sure you place the font in the assets folder of your directory!
var FONT = Files.readChunk(mergeURI(application.url, "assets/font.bin"))
exports.Graphics = {
    init: function(width, height) {
        this._width = width;
        this._height = height;
        //immutable physical width and height regardless of rotation
        this.WIDTH = width;
        this.HEIGHT = height;
        this.rotation = 0;
        this.cursor_y = 0;
        this.cursor_x = 0;
        this.textsize = 1;
        this.textcolor = 0xFFFF;
        this.textbgcolor = 0xFFFF;
        this.wrap = true;
        this._cp437 = false;
    },
    setRotation: function(x) {
    	this.rotation = (x&3);
    	switch (rotation) {
    		case 0:
    		case 2:
    			this._width = this.WIDTH;
    			this._height = this.HEIGHT;
    			break;
    		case 1:
    		case 3:
    			this._width = this.HEIGHT;
    			this._height = this.WIDTH;
    			break;
    	}
    },
    height: function() {
        return this._height;
    },
    width: function() {
        return this._width;
    },
    drawCircle: function(x0, y0, r, color) {
        var f = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x = 0;
        var y = r;
        this.drawPixel(x0, y0 + r, color);
        this.drawPixel(x0, y0 - r, color);
        this.drawPixel(x0 + r, y0, color);
        this.drawPixel(x0 - r, y0, color);
        while (x < y) {
            if (f >= 0) {
                y--;
                ddF_y += 2;
                f += ddF_y;
            }
            x++;
            ddF_x += 2;
            f += ddF_x;
            this.drawPixel(x0 + x, y0 + y, color);
            this.drawPixel(x0 - x, y0 + y, color);
            this.drawPixel(x0 + x, y0 - y, color);
            this.drawPixel(x0 - x, y0 - y, color);
            this.drawPixel(x0 + y, y0 + x, color);
            this.drawPixel(x0 - y, y0 + x, color);
            this.drawPixel(x0 + y, y0 - x, color);
            this.drawPixel(x0 - y, y0 - x, color);
        }
    },
    drawChar: function(x, y, c, color, bg, size) {
        if ((x >= this._width) || // Clip right
            (y >= this._height) || // Clip bottom
            ((x + 6 * size - 1) < 0) || // Clip left
            ((y + 8 * size - 1) < 0)) // Clip top
            return;
        if (!this._cp437 && (c >= 176)) {
            c++;
        }
        for (var i = 0; i < 6; i++) {
            var line;
            if (i == 5) {
                line = 0x0;
            } else {
                line = FONT[c * 5 + i];
            }
            for (var j = 0; j < 8; j++) {
                if (line & 0x1) {
                    if (size == 1) {
                        this.drawPixel(x + i, y + j, color);
                    } else {
                        this.fillRect(x + (i * size), y + (j * size), size, size, color);
                    }
                } else if (bg != color) {
                    if (size == 1) {
                        this.drawPixel(x + i, y + j, bg);
                    } else {
                        this.fillRect(x + i * size, y + j * size, size, size, bg);
                    }
                }
                line >>= 1;
            }
        }
    },
    setCursor: function(x, y) {
        this.cursor_x = x;
        this.cursor_y = y;
    },

    setTextSize: function(s) {
        this.textsize = (s > 0) ? s : 1;
    },
    setTextColor: function(c, b) {
        this.textcolor = c;
        if (b === undefined) {
            this.textbgcolor = c;
        } else {
            this.textbgcolor = b;
        }
    },
    write: function(c) {
        if (typeof c === "string") {
            if (c.length === 1) {
                c = c.charCodeAt(0);
            } else {
                trace("Call print or println instead of write with strings!\n")
                return;
            }
        }
        if (c === 10) { //\n
            this.cursor_y += this.textsize * 8;
            this.cursor_x = 0;
        } else if (c === 13) { //\r
            //skip
        } else {
            this.drawChar(this.cursor_x, this.cursor_y, c, this.textcolor, this.textbgcolor, this.textsize);
            this.cursor_x += this.textsize * 6;
            if (this.wrap && (this.cursor_x > (this._width - this.textsize * 6))) {
                this.cursor_y += this.textsize * 8;
                this.cursor_x = 0;
            }
        }
        return 1;
    },
    println: function(text) {
        if (text !== undefined) {
            text = text.toString()
            for (var i = 0; i < text.length; i++) {
                this.write(text.charCodeAt(i));
            }
        }
        this.write('\n');
    },
    print: function(text) {
        for (var i = 0; i < text.length; i++) {
            this.write(text.charCodeAt(i));
        }
    },
    //should have thought of drawpixel earlier for conversion... just go through bit by bit
    //if this errors, make sure the dimensions are a multiple of 8
    drawBitmap: function(x, y, bitmap, w, h, color, bgcolor) {
        var byteWidth = (w + 7) >> 3; //equivalent to Math.ceil
        for (var j = 0; j < h; j++) {
            for (var i = 0; i < w; i++) {
                if (bitmap[j * byteWidth + (i >> 3)] & (128 >> (i & 7))) {
                    this.drawPixel(x + i, y + j, color);
                } else if (bgcolor !== undefined) {
                    this.drawPixel(x + i, y + j, bgcolor);
                }
            }
        }
    },
    //Draw XBitMap Files (*.xbm), exported from GIMP,
    //Usage: Export from GIMP to *.xbm, rename *.xbm to *.c and open in editor.
    //C Array can be directly used with this function

    //the byte order is just the reverse of drawBitmap; i.e, first bit of each byte corresponds to the rightmost pixel of the chunk it represents and the rightmost bit is the left most pixel
    drawXBitmap: function(x, y, bitmap, w, h, color) {
        var byteWidth = Math.floor((w + 7) / 8);
        for (var j = 0; j < h; j++) {
            for (var i = 0; i < w; i++) {
                if (bitmap[j * byteWidth + (i >> 3)] & (1 << (i & 7))) {
                    this.drawPixel(x + i, y + j, color);
                }
            }
        }
    },
    drawLine: function(x0, y0, x1, y1, color) {
        var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        if (steep) {
            //swap x0 and y0 
            //thanks http://stackoverflow.com/questions/16201656/how-to-swap-two-variables-in-javascript
            x0 = [y0, y0 = x0][0]
            x1 = [y1, y1 = x1][0]
        }
        if (x0 > x1) {
            x0 = [x1, x1 = x0][0]
            y0 = [y1, y1 = y0][0]
        }
        var dx = x1 - x0;
        var dy = Math.abs(y1 - y0);

        var err = dx / 2;
        var ystep;

        if (y0 < y1) {
            ystep = 1;
        } else {
            ystep = -1;
        }

        for (; x0 <= x1; x0++) {
            if (steep) {
                this.drawPixel(y0, x0, color);
            } else {
                this.drawPixel(x0, y0, color);
            }
            err -= dy;
            if (err < 0) {
                y0 += ystep;
                err += dx;
            }
        }
    },
    drawFastHLine: function(x, y, w, color) {
        //implement native one
        this.drawLine(x, y, x + w - 1, y, color);
    },
    drawFastVLine: function(x, y, h, color) {
        this.drawLine(x, y, x, y + h - 1, color);
    },
    drawRect: function(x, y, w, h, color) {
        this.drawFastHLine(x, y, w, color);
        this.drawFastHLine(x, y + h - 1, w, color);
        this.drawFastVLine(x, y, h, color);
        this.drawFastVLine(x + w - 1, y, h, color);
    },
    fillRect: function(x, y, w, h, color) {
        for (var i = x; i < x + w; i++) {
            this.drawFastVLine(i, y, h, color);
        }
    },
    fillCircle: function(x0, y0, r, color) {
        this.drawFastVLine(x0, y0 - r, 2 * r + 1, color);
        this.fillCircleHelper(x0, y0, r, 3, 0, color);
    },
    fillCircleHelper: function(x0, y0, r, cornername, delta, color) {
        var f = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x = 0;
        var y = r;
        while (x < y) {
            if (f >= 0) {
                y--;
                ddF_y += 2;
                f += ddF_y;
            }
            x++;
            ddF_x += 2;
            f += ddF_x;

            if (cornername & 0x1) {
                this.drawFastVLine(x0 + x, y0 - y, 2 * y + 1 + delta, color);
                this.drawFastVLine(x0 + y, y0 - x, 2 * x + 1 + delta, color);
            }
            if (cornername & 0x2) {
                this.drawFastVLine(x0 - x, y0 - y, 2 * y + 1 + delta, color);
                this.drawFastVLine(x0 - y, y0 - x, 2 * x + 1 + delta, color);
            }
        }
    },
    drawRoundRect: function(x, y, w, h, r, color) {
        // smarter version
        this.drawFastHLine(x + r, y, w - 2 * r, color); // Top
        this.drawFastHLine(x + r, y + h - 1, w - 2 * r, color); // Bottom
        this.drawFastVLine(x, y + r, h - 2 * r, color); // Left
        this.drawFastVLine(x + w - 1, y + r, h - 2 * r, color); // Right
        // draw four corners
        this.drawCircleHelper(x + r, y + r, r, 1, color);
        this.drawCircleHelper(x + w - r - 1, y + r, r, 2, color);
        this.drawCircleHelper(x + w - r - 1, y + h - r - 1, r, 4, color);
        this.drawCircleHelper(x + r, y + h - r - 1, r, 8, color);
    },
    drawCircleHelper: function(x0, y0, r, cornername, color) {
        var f = 1 - r;
        var ddF_x = 1;
        var ddF_y = -2 * r;
        var x = 0;
        var y = r;

        while (x < y) {
            if (f >= 0) {
                y--;
                ddF_y += 2;
                f += ddF_y;
            }
            x++;
            ddF_x += 2;
            f += ddF_x;
            if (cornername & 0x4) {
                this.drawPixel(x0 + x, y0 + y, color);
                this.drawPixel(x0 + y, y0 + x, color);
            }
            if (cornername & 0x2) {
                this.drawPixel(x0 + x, y0 - y, color);
                this.drawPixel(x0 + y, y0 - x, color);
            }
            if (cornername & 0x8) {
                this.drawPixel(x0 - y, y0 + x, color);
                this.drawPixel(x0 - x, y0 + y, color);
            }
            if (cornername & 0x1) {
                this.drawPixel(x0 - y, y0 - x, color);
                this.drawPixel(x0 - x, y0 - y, color);
            }
        }

    },
    fillRoundRect: function(x, y, w, h, r, color) {
        this.fillRect(x + r, y, w - 2 * r, h, color);
        // draw four corners
        this.fillCircleHelper(x + w - r - 1, y + r, r, 1, h - 2 * r - 1, color);
        this.fillCircleHelper(x + r, y + r, r, 2, h - 2 * r - 1, color);
    },
    drawTriangle: function(x0, y0, x1, y1, x2, y2, color) {
        this.drawLine(x0, y0, x1, y1, color);
        this.drawLine(x1, y1, x2, y2, color);
        this.drawLine(x2, y2, x0, y0, color);

    },
    fillTriangle: function(x0, y0, x1, y1, x2, y2, color) {
        var a, b, y, last;
        if (y0 > y1) {
            y0 = [y1, y1 = y0][0]
            x0 = [x1, x1 = x0][0]
        }
        if (y1 > y2) {
            y2 = [y1, y1 = y2][0]
            x2 = [x1, x1 = x2][0]
        }
        if (y0 > y1) {
            y0 = [y1, y1 = y0][0]
            x0 = [x1, x1 = x0][0]
        }

        if (y0 == y2) { // Handle awkward all-on-same-line case as its own thing
            a = b = x0;
            if (x1 < a) a = x1;
            else if (x1 > b) b = x1;
            if (x2 < a) a = x2;
            else if (x2 > b) b = x2;
            this.drawFastHLine(a, y0, b - a + 1, color);
            return;
        }
        var
            dx01 = x1 - x0,
            dy01 = y1 - y0,
            dx02 = x2 - x0,
            dy02 = y2 - y0,
            dx12 = x2 - x1,
            dy12 = y2 - y1;
        var sa = 0;
        var sb = 0;
        if (y1 == y2) {
            last = y1;
        } else {
            last = y1 - 1;
        }
        for (y = y0; y <= last; y++) {
            a = x0 + sa / dy01;
            b = x0 + sb / dy02;
            sa += dx01;
            sb += dx02;
            if (a > b) {
                a = [b, b = a][0]
            }
            this.drawFastHLine(a, y, b - a + 1, color);
        }
        sa = dx12 * (y - y1);
        sb = dx02 * (y - y0);
        for (; y <= y2; y++) {
            a = x1 + sa / dy12;
            b = x0 + sb / dy02;
            sa += dx12;
            sb += dx02;
            if (a > b) {
                a = [b, b = a][0];
            }
            this.drawFastHLine(a, y, b - a + 1, color);
        }
    }
}