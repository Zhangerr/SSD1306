//@module
//BLL for the SSD1306 128x32 OLED Display - http://www.adafruit.com/products/931
//Adapted from https://github.com/adafruit/Adafruit_SSD1306/blob/master/Adafruit_SSD1306.cpp

//only supports 128x32 and 128x64 right now, but I've made it so that the code can be easily modified to new screen sizes

var TIME = false;

var SSD1306 = {};
SSD1306.setup = function(data, reset, width, height) {
    this.rst = reset;
    this.data = data;
    this.WIDTH = width;
    this.HEIGHT = height;
}
SSD1306.setup.private = true;

SSD1306.ssd1306_command = function(c) {
    var control = 0x00;
    this.data.writeBlock(control, c);
}
SSD1306.ssd1306_command.private = true;

SSD1306.invertDisplay = function(invert) {
    if (invert) {
        this.ssd1306_command(SSD1306_INVERTDISPLAY);
    } else {
        this.ssd1306_command(SSD1306_NORMALDISPLAY);
    }
}
SSD1306.startscrollright = function(start, stop) {
    this.ssd1306_command(SSD1306_RIGHT_HORIZONTAL_SCROLL);
    this.ssd1306_command(0X00);
    this.ssd1306_command(start);
    this.ssd1306_command(0X00);
    this.ssd1306_command(stop);
    this.ssd1306_command(0X00);
    this.ssd1306_command(0XFF);
    this.ssd1306_command(SSD1306_ACTIVATE_SCROLL);
}
SSD1306.startscrollleft = function(start, stop) {
    this.ssd1306_command(SSD1306_LEFT_HORIZONTAL_SCROLL);
    this.ssd1306_command(0X00);
    this.ssd1306_command(start);
    this.ssd1306_command(0X00);
    this.ssd1306_command(stop);
    this.ssd1306_command(0X00);
    this.ssd1306_command(0XFF);
    this.ssd1306_command(SSD1306_ACTIVATE_SCROLL);
}
SSD1306.startscrolldiagright = function(start, stop) {
    this.ssd1306_command(SSD1306_SET_VERTICAL_SCROLL_AREA);
    this.ssd1306_command(0X00);
    this.ssd1306_command(this.HEIGHT);
    this.ssd1306_command(SSD1306_VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL);
    this.ssd1306_command(0X00);
    this.ssd1306_command(start);
    this.ssd1306_command(0X00);
    this.ssd1306_command(stop);
    this.ssd1306_command(0X01);
    this.ssd1306_command(SSD1306_ACTIVATE_SCROLL);
}
SSD1306.startscrolldiagleft = function(start, stop) {
    this.ssd1306_command(SSD1306_SET_VERTICAL_SCROLL_AREA);
    this.ssd1306_command(0X00);
    this.ssd1306_command(this.HEIGHT);
    this.ssd1306_command(SSD1306_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL);
    this.ssd1306_command(0X00);
    this.ssd1306_command(start);
    this.ssd1306_command(0X00);
    this.ssd1306_command(stop);
    this.ssd1306_command(0X01);
    this.ssd1306_command(SSD1306_ACTIVATE_SCROLL);
}
SSD1306.stopscroll = function() {
    this.ssd1306_command(SSD1306_DEACTIVATE_SCROLL);
}

SSD1306.begin = function(reset) {
    this.vccstate = SSD1306_SWITCHCAPVCC;
    if (reset) {
        this.rst.write(1);
        sensorUtils.mdelay(1);
        this.rst.write(0);
        sensorUtils.mdelay(10);
        this.rst.write(1);
        //add delay to give device time to reset
        sensorUtils.mdelay(200);
    }
    if (this.HEIGHT === 32) {
    // Init sequence for 128x32 OLED module
    this.ssd1306_command(SSD1306_DISPLAYOFF); // 0xAE
    this.ssd1306_command(SSD1306_SETDISPLAYCLOCKDIV); // 0xD5
    this.ssd1306_command(0x80); // the suggested ratio 0x80
    this.ssd1306_command(SSD1306_SETMULTIPLEX); // 0xA8
    this.ssd1306_command(0x1F);
    this.ssd1306_command(SSD1306_SETDISPLAYOFFSET); // 0xD3
    this.ssd1306_command(0x0); // no offset
    this.ssd1306_command(SSD1306_SETSTARTLINE | 0x0); // line #0
    this.ssd1306_command(SSD1306_CHARGEPUMP); // 0x8D
    if (this.vccstate == SSD1306_EXTERNALVCC) {
        this.ssd1306_command(0x10);
    } else {
        this.ssd1306_command(0x14);
    }
    this.ssd1306_command(SSD1306_MEMORYMODE); // 0x20
    this.ssd1306_command(0x00); // 0x0 act like ks0108
    this.ssd1306_command(SSD1306_SEGREMAP | 0x1);
    this.ssd1306_command(SSD1306_COMSCANDEC);
    this.ssd1306_command(SSD1306_SETCOMPINS); // 0xDA
    this.ssd1306_command(0x02);
    this.ssd1306_command(SSD1306_SETCONTRAST); // 0x81
    this.ssd1306_command(0x8F);
    this.ssd1306_command(SSD1306_SETPRECHARGE); // 0xd9
    if (this.vccstate == SSD1306_EXTERNALVCC) {
        this.ssd1306_command(0x22);
    } else {
        this.ssd1306_command(0xF1);
    }
    this.ssd1306_command(SSD1306_SETVCOMDETECT); // 0xDB
    this.ssd1306_command(0x40);
    this.ssd1306_command(SSD1306_DISPLAYALLON_RESUME); // 0xA4
    this.ssd1306_command(SSD1306_NORMALDISPLAY); // 0xA6
    } else {
        // Init sequence for 128x64 OLED module
    this.ssd1306_command(SSD1306_DISPLAYOFF);                    // 0xAE
    this.ssd1306_command(SSD1306_SETDISPLAYCLOCKDIV);            // 0xD5
    this.ssd1306_command(0x80);                                  // the suggested ratio 0x80
    this.ssd1306_command(SSD1306_SETMULTIPLEX);                  // 0xA8
    this.ssd1306_command(0x3F);
    this.ssd1306_command(SSD1306_SETDISPLAYOFFSET);              // 0xD3
    this.ssd1306_command(0x0);                                   // no offset
    this.ssd1306_command(SSD1306_SETSTARTLINE | 0x0);            // line #0
    this.ssd1306_command(SSD1306_CHARGEPUMP);                    // 0x8D
    if (this.vccstate == SSD1306_EXTERNALVCC) 
      { this.ssd1306_command(0x10); }
    else 
      { this.ssd1306_command(0x14); }
    this.ssd1306_command(SSD1306_MEMORYMODE);                    // 0x20
    this.ssd1306_command(0x00);                                  // 0x0 act like ks0108
    this.ssd1306_command(SSD1306_SEGREMAP | 0x1);
    this.ssd1306_command(SSD1306_COMSCANDEC);
    this.ssd1306_command(SSD1306_SETCOMPINS);                    // 0xDA
    this.ssd1306_command(0x12);
    this.ssd1306_command(SSD1306_SETCONTRAST);                   // 0x81
    if (this.vccstate == SSD1306_EXTERNALVCC) 
      { this.ssd1306_command(0x9F); }
    else 
      { this.ssd1306_command(0xCF); }
    this.ssd1306_command(SSD1306_SETPRECHARGE);                  // 0xd9
    if (this.vccstate == SSD1306_EXTERNALVCC) 
      { this.ssd1306_command(0x22); }
    else 
      { this.ssd1306_command(0xF1); }
    this.ssd1306_command(SSD1306_SETVCOMDETECT);                 // 0xDB
    this.ssd1306_command(0x40);
    this.ssd1306_command(SSD1306_DISPLAYALLON_RESUME);           // 0xA4
    this.ssd1306_command(SSD1306_NORMALDISPLAY);    
    }
    this.ssd1306_command(SSD1306_DISPLAYON); //--turn on oled panel
}

SSD1306.display = function(buffer) {
    this.ssd1306_command(SSD1306_COLUMNADDR);
    this.ssd1306_command(0); // Column start address (0 = reset)
    this.ssd1306_command(this.WIDTH - 1); // Column end address (127 = reset)
    this.ssd1306_command(SSD1306_PAGEADDR);
    this.ssd1306_command(0); // Page start address (0 = reset)
    if (this.HEIGHT === 32) {
    	this.ssd1306_command(3); // Page end address
    } else {
    	this.ssd1306_command(7);
    }
    
    var i2cbuffer = new Array(16);
    var now = Date.now();
    for (var i = 0; i < (this.WIDTH * this.HEIGHT / 8); i++) {
        for (var x = 0; x < 16; x++) {
            i2cbuffer[x] = buffer[i];
            i++;
        }
        i--;
        this.data.writeBlock(0x40, i2cbuffer);
    }
    if (TIME) {
    	trace((Date.now() - now) + "\n");
    }
}

var BLACK = 0;
var WHITE = 1;
var INVERSE = 2;
var SSD1306_SETCONTRAST = 0x81;
var SSD1306_DISPLAYALLON_RESUME = 0xA4;
var SSD1306_DISPLAYALLON = 0xA5;
var SSD1306_NORMALDISPLAY = 0xA6;
var SSD1306_INVERTDISPLAY = 0xA7;
var SSD1306_DISPLAYOFF = 0xAE;
var SSD1306_DISPLAYON = 0xAF;

var SSD1306_SETDISPLAYOFFSET = 0xD3;
var SSD1306_SETCOMPINS = 0xDA;

var SSD1306_SETVCOMDETECT = 0xDB;

var SSD1306_SETDISPLAYCLOCKDIV = 0xD5;
var SSD1306_SETPRECHARGE = 0xD9;

var SSD1306_SETMULTIPLEX = 0xA8;

var SSD1306_SETLOWCOLUMN = 0x00;
var SSD1306_SETHIGHCOLUMN = 0x10;

var SSD1306_SETSTARTLINE = 0x40;

var SSD1306_MEMORYMODE = 0x20;
var SSD1306_COLUMNADDR = 0x21;
var SSD1306_PAGEADDR = 0x22;

var SSD1306_COMSCANINC = 0xC0;
var SSD1306_COMSCANDEC = 0xC8;

var SSD1306_SEGREMAP = 0xA0;

var SSD1306_CHARGEPUMP = 0x8D;

var SSD1306_EXTERNALVCC = 0x1;
var SSD1306_SWITCHCAPVCC = 0x2;

// Scrolling vars =;
var SSD1306_ACTIVATE_SCROLL = 0x2F;
var SSD1306_DEACTIVATE_SCROLL = 0x2E;
var SSD1306_SET_VERTICAL_SCROLL_AREA = 0xA3;
var SSD1306_RIGHT_HORIZONTAL_SCROLL = 0x26;
var SSD1306_LEFT_HORIZONTAL_SCROLL = 0x27;
var SSD1306_VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL = 0x29;
var SSD1306_VERTICAL_AND_LEFT_HORIZONTAL_SCROLL = 0x2A;

exports.SSD1306 = SSD1306;