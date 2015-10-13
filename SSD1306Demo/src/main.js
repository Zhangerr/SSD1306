//@program
var THEME = require('themes/flat/theme');
var BUTTONS = require('controls/buttons');
var KEYBOARD = require('mobile/keyboard');
var CONTROL = require('mobile/control');

var DISPLAY = require("SSD1306")
var KLOGO = Files.readChunk(mergeURI(application.url, "assets/logo.bin"))
var KWORDMARK = Files.readChunk(mergeURI(application.url, "assets/wordmark.bin"))
var WHITE = 1;
var BLACK = 0;
var display = Object.create(DISPLAY.SSD1306);

display.setup(128, 64, function() {
    display.begin(true); 
    display.drawBitmap(0, 15, KLOGO, 32, 32, WHITE);
    display.drawXBitmap(0, 15, KWORDMARK, 128, 32, WHITE);
    display.display();
    
});

var tests = {}
tests.testdrawchar = function() {
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 0);
    for (var i = 0; i < 168; i++) {
        if (i === 10) continue; //'\n' == 10
        display.write(i);
        if ((i > 0) && (i % 21 == 0)) display.println();
    }
    display.display();
}

tests.testdrawcircle = function() {
    for (var i = 0; i < display.height(); i += 2) {
        display.drawCircle(display.width() / 2, display.height() / 2, i, WHITE);
        display.display();
    }
}

tests.testfillrect = function() {
    var color = 1;
    for (var i = 0; i < display.height() / 2; i += 3) {
        // alternate colors
        display.fillRect(i, i, display.width() - i * 2, display.height() - i * 2, color % 2);
        display.display();
        color++;
    }
}

tests.testdrawtriangle = function() {
    for (var i = 0; i < Math.min(display.width(), display.height()) / 2; i += 5) {
        display.drawTriangle(display.width() / 2, display.height() / 2 - i, display.width() / 2 - i, display.height() / 2 + i, display.width() / 2 + i, display.height() / 2 + i, WHITE);
        display.display();
    }
}

tests.testfilltriangle = function() {
    var color = WHITE;
    for (var i = Math.min(display.width(), display.height()) / 2; i > 0; i -= 5) {
        display.fillTriangle(display.width() / 2, display.height() / 2 - i, display.width() / 2 - i, display.height() / 2 + i, display.width() / 2 + i, display.height() / 2 + i, WHITE);
        if (color == WHITE) color = BLACK;
        else color = WHITE;
        display.display();
    }
}

tests.testdrawroundrect = function() {
    for (var i = 0; i < display.height() / 2 - 2; i += 2) {
        display.drawRoundRect(i, i, display.width() - 2 * i, display.height() - 2 * i, display.height() / 4, WHITE);
        display.display();
    }
}

tests.testfillroundrect = function() {
    var color = WHITE;
    for (var i = 0; i < display.height() / 2 - 2; i += 2) {
        display.fillRoundRect(i, i, display.width() - 2 * i, display.height() - 2 * i, display.height() / 4, color);
        if (color == WHITE) color = BLACK;
        else color = WHITE;
        display.display();
    }
}

tests.testdifferentsizetext = function() {
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 0);
    display.println("Hello, world!");
    display.setTextColor(BLACK, WHITE); // 'inverted' text
    display.println(3.141592);
    display.setTextSize(2);
    display.setTextColor(WHITE);
    display.println("0xDEADBEEF");
    display.display();
}

tests.testdrawrect = function() {
    for (var i = 0; i < display.height() / 2; i += 2) {
        display.drawRect(i, i, display.width() - 2 * i, display.height() - 2 * i, WHITE);
        display.display();
    }
}
var testArray = [];
for (var i in tests) {
	if (tests.hasOwnProperty(i)) {
		testArray.push(tests[i])
	}
}
function fill()
{
	var stripBehavior = Behavior({
		onCreate: function(strip) {
			this.index = 0;
			strip.duration = 1;
		},
		onFinished: function(strip) {
			display.clearDisplay()
			testArray[this.index]();
			display.display();
			if (this.index < testArray.length - 1) {
				this.index += 1;
				strip.time = 0;
				strip.duration = 2000;
				strip.start();
			}
		},
	});
	return new Content({top: 0, left: 0, bottom: 0, right: 0, visible:false, behavior: stripBehavior}); 
}

var strip = fill();
var nameInputSkin = new Skin({ borders: { left:2, right:2, top:2, bottom:2 }, stroke: 'black',});
var fieldStyle = new Style({ color: 'black', font: 'bold 24px', horizontal: 'middle', vertical: 'middle', left: 5, right: 5, top: 5, bottom: 5, });
var fieldHintStyle = new Style({ color: '#aaa', font: '24px', horizontal: 'middle', vertical: 'middle', left: 5, right: 5, top: 5, bottom: 5, });
var titleStyle = new Style({font:"bold 20px", color:"black"});
var tempLabel = new Label({left: 0, right: 0, string: "23", editable:true, style: titleStyle});

var whiteSkin = new Skin({fill:"white"});
var MyField = Container.template(function($) { return { 
  width:200, height: 36, right:5, left:5, skin: nameInputSkin, contents: [
    Scroller($, { 
      left: 0, right: 0, top: 0, bottom: 0, active: true, 
      behavior: Object.create(CONTROL.FieldScrollerBehavior.prototype), clip: true, contents: [
        Label($, { 
          left: 0, top: 0, bottom: 0, style: fieldStyle, anchor: 'NAME',
          editable: true, string: $.name, name:"inputLabel",
         	behavior: Object.create( CONTROL.FieldLabelBehavior.prototype, {
         		onEdited: { value: function(label){
              		if (label.string.length > 0) {
              		display.clearDisplay();
              		display.setCursor(0,0);
              		display.println(label.string);
              		display.display();
              		}
              		label.container.hint.visible = ( label.string.length == 0 );	
         		}}
         	}),
         }),
         Label($, {
   			 	left:4, right:4, top:4, bottom:4, style:fieldHintStyle, string:"Type something....", name:"hint"
         })
      ]
    })
  ]
}});
var MyButtonTemplate = BUTTONS.Button.template(function($){ return{
   width:100, left:5, height:30,
  contents:[
    new Label({left:0, right:0, height:55, string:$.textForLabel, style:new Style({font:"bold 25px", color:"#000"})})
  ],
  behavior: Object.create(BUTTONS.ButtonBehavior.prototype, {
    onTap: { value:  $.fn
    }
  })
}});
var button = new MyButtonTemplate({textForLabel:"Tests", fn:function(button){
      strip.behavior.index = 0;
      strip.start(); 
}});
var button1 = new MyButtonTemplate({textForLabel:"Scroll", fn:function(button){
      display.startscrollleft(0x00, 0x0F);
    }});
var button2 = new MyButtonTemplate({textForLabel:"Stop Scroll", fn:function(button){
      display.stopscroll();
    }});
var config = {name:""};
var field = new MyField(config);


var columns = new Column({
	left:0, right:0, top:0, bottom:0, skin:whiteSkin, contents: [
	new Line({top:0,height:30, left:0, right:0, skin:new Skin({fill:"#d8e7f3"}), contents: [new Label({left:0, top:0, right:0, height:30, string:"OLED Display", style:new Style({font:"bold 30px", color:"black"})})]}),
	new Line({left:0,  right:0,  height:30, skin:new Skin({fill:"#d8e7f3",borders: {  bottom:2 }, stroke: 'black'}),contents:[new Label({left: 10, string: "Output text", horizontal: "left", style: titleStyle})]}),
	new Line({ left:0, right:0, height: 80, skin:new Skin({fill:"#b2cee6"}), contents: [
		field]}),
	new Line({left:0,  right:0,  height:30, skin:new Skin({fill:"#b2cee6",borders: {  bottom:2 }, stroke: 'black'}),contents:[new Label({left: 10, string: "Demos", horizontal: "left", style: titleStyle})]}),
	new Line({top:0, bottom:0, left:0, right:0, skin:new Skin({fill:"#689dca"}),contents: [button1, button2,new Container({top:0, left:0, right:0, bottom:0, contents:[button,  strip]})]})
	], behavior:Object.create(Column.prototype, {
    onTouchEnded: { value: function(content){
      KEYBOARD.hide();
      content.focus();
    }}
  }), active:true
	
});
application.add(columns);
