#SSD1306 Kinoma Port Documentation
##Overview
The SSD1306 is a monochromatic OLED display that is capable of rendering text, images, and simple shapes. The following two sizes are supported, and can be purchased from Adafruit:

[128x32 Display](http://www.adafruit.com/products/661)  
[128x64 Display](http://www.adafruit.com/products/938)

*Note:* While there are SPI variants for these displays, **only the I<sup>2</sup>C protocol is supported.**

The library is a port of two existing Arduino Adafruit libraries ([Graphics](https://github.com/adafruit/Adafruit-GFX-Library) and [SSD1306](https://github.com/adafruit/Adafruit_SSD1306)) to Kinoma devices and aims to be as compliant as possible in Javascript with the original C code.

It will work as-is for the Kinoma Create, but will take some modification to work for the Kinoma Element. There is an alpha version on a development branch that has Element support, but it is very unstable: crashes due to `malloc` failures occur frequently and it appears a pull-up resistor for the clock/data line is required in order for the display to initialize properly.

The major noticeable different between the Kinoma and Arduino version of the libraries is that the Arduino version runs much faster and more smoothly, while screen wipes and chopping animations are clearly visible on the Kinoma version. This is due to a known error with the Create/Element firmware in which the clock line of the I<sup>2</sup>C bus runs at a speed much slower than its maximum.
##Quickstart
 
###Hardware Setup
Solder the headers and connect the pins. For the Create:

 * V<sub>in</sub> goes to 3.3V (5V is also ok)
 * GND goes to ground
 * SCL goes to pin 29
 * SDA goes to pin 27
 * RST goes to pin 21
 
 These can all be changed in the library, just modify `SSD1306.js` in the `src` directory
###Project Setup 
 
 1. Create a new project in Kinoma Studio
 2. Add `SSD1306` to the build path
 3. Ensure that the `Pins` module is in your workspace
 4. Make the folder `assets` as a subdirectory of `src`
 5. Place the `font.bin` file inside the assets directory  (**Required** even if not rendering text) 
 
 *Note*: Steps four and five should already be in place if you simply cloned this repo.
 
###Code Setup
 1. Import the library:
 
     ```
    var DISPLAY = require("SSD1306")
     ```
 2. Create and initialize the object:
 
    ```
    var display = Object.create(DISPLAY.SSD1306);
    //setup begins communication with the BLL while begin actually sends the initialization messages to the display
    //both must be called before any drawing is performed
    display.setup(128, 64, function() {
        //callback required due to the asynchronous nature of the Pins module
        //perhaps es6 promises will remedy this
        display.begin(true); 
    });
    ```
    *Note:* If you want to display anything on the display right after the initialization, add it to the callback
 3. Start drawing! Note that since the display is buffered, no changes will show up on the screen until you call `display`. This allows a sequence of drawing commands to apply simultaneously to the display. A sampler of some of the available functions:
 
    ```
    //color constants for all functions
    var WHITE = 1;
    var BLACK = 0;
    display.drawPixel(10, 10, WHITE);
    //display must be called after any drawing commands 
    //in order for them to actually be visible
    display.display();
    //Refer to the "Rendering Images" section for more information
    var KLOGO = Files.readChunk(mergeURI(application.url, "assets/logo.bin"));
    display.drawBitmap(0, 15, KLOGO, 32, 32, WHITE);
    display.display();
    //Render text
    display.setTextSize(2);
    display.println("Kinoma");
    display.display();
    ```
For an example that makes full use of all the functions that the library has to offer, check out the original example code included in the [Arduino library](https://github.com/adafruit/Adafruit_SSD1306/blob/master/examples/ssd1306_128x32_i2c/ssd1306_128x32_i2c.ino).
     

 

 
###Rendering Images
The library is capable of displaying images but requires a special conversion process (considering the monochrome nature of the display) in order to properly render them.
The process is as follows:

 1. Select a simple image. Images that use less colors and have less complex details usually translate better.
 2. Use an image editor (e.g Photoshop or Gimp) to crop/resize the image so that the dimensions are appropriate for the display. **The dimensions must be a multiple of 8, or else the display will not render them properly or even crash!** This is due to the fact that each image byte represents 8 pixels in the display.
 3. Use the following tool to convert the images into an array of bytes: <http://manytools.org/hacker-tools/image-to-byte-array/>. Alternatively, use Gimp to first [convert the image](http://docs.gimp.org/en/gimp-image-convert-indexed.html) into a monochrome bitmap, and then export the result as a `.xbm` file. Open up the `.xbm` with a text editor and use the C array in the file for the following steps.
 4. The generated array (once formatted as Javascript)is usable as-is with the library, and can be used as follows:
 
    ```
    var image = [0x23, 0xc4, 0x2a...]; //your image
    display.drawBitmap(x, y, image, width, height, WHITE);
    display.drawXBitmap(x, y, image, width, height, WHITE); //use this if you converted with gimp
    ```
    However, one caveat: **regular Javascript arrays are extremely memory inefficient** for byte values, which is a big problem for the Kinoma Element. While this will work fine for small images, consider the following the remaining steps in order to compact the image into a Chunk (which is essentially a `Uint8Array`)
 5. Convert the array into a binary file with the programming language of your choice. Here is a sample function for use with KinomaJS to write out a binary file:
 
    ```
    //put the contents of the resulting array from the website here
    var image = [0x23, 0xc4, 0x2a...]; 
    function convertToFile(array, name) {
            var uri = mergeURI(Files.documentsDirectory, name);
            var c = new Chunk(array.length);
            for (var i = 0; i < array.length; i++) {
                c[i] = array[i];
            }
            Files.writeChunk(uri, c);
    }
    convertToFile(image, "image.bin");
    ```
 6. Put the binary into the `src/assets` folder of the project, creating it if it doesn't already exist. In the code, load the bitmap and use it like so:
 
    ```
    var KLOGO = Files.readChunk(mergeURI(application.url, "assets/logo.bin"));
    display.drawBitmap(0, 15, KLOGO, 32, 32, WHITE); //again, use drawXBitmap if you used Gimp to export
    ```

 
##Sample Usage
A demo Kinoma Create app is available that showcases potential integrations and uses cases of the display, and is also a good example of how to use the library with a GUI.
##Simulator
A pin simulator for prototyping with the display in Kinoma Studio is also included as part of the library. Any existing display code should work identically with the simulator, but be wary of the following caveats:

 * Too many on-screen pixels at once cause the simulator to crash (for reasons unknown)
 * Functions that depend on hardware commands besides drawing will **not** work, such as scrolling or inverting
 
##Library Reference
Most essential functions are listed here. The remaining functions are either deprecated or internal to the library.

For drawing functions, the following constants should be declared to make colors easier to use:

```
var WHITE = 1;
var BLACK = 0;
```
###setup  
`SSD1306.setup(width, height, callback)`  
#####Description
Initializes the BLL with the given `width` and `height` parameters. Invokes `callback` on a successful pin configuration. Uses pin 27 and 29 for SDA/SCL respectively, and pin 21 for reset.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `width` | `int`  width of the display (typically 128) | 
| `height` | `int` height of the display (will be used to determine I<sup>2</sup>C address)  | 
| `callback` | `function` function to call upon successful pin configuration. Recommended that begin is called.  |

###begin  
`SSD1306.begin(reset)`  
#####Description
Sends the initialization sequence to the display. Must be called before any drawing occurs.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `reset` | `boolean` determines whether the display is reset or not | 

###display  
`SSD1306.display()`  
#####Description
Flushes the buffer and draws to the screen. Must be called to make any drawing calls visible.
###clearDisplay  
`SSD1306.clearDisplay()`  
####Description
Zeroes out the entire buffer to create a blank slate for drawing.
###drawPixel  
`SSD1306.drawPixel(x, y, color)`  
#####Description
Draws a single pixel to the screen at `(x,y)` with `color`. 
The origin of the screen is the top left. 
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x` | `int` x-coordinate of the pixel| 
| `y` | `int` y-coordinate of the pixel| 
| `color` | `int` color of the pixel, which is either `WHITE` or `BLACK`| 

###drawCircle  
`SSD1306.drawCircle(x, y, r, color)`  
#####Description
Draws a `color` circle centered at `(x,y)` with radius `r`.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x` | `int` x-coordinate of the circle| 
| `y` | `int` y-coordinate of the circle| 
| `r` | `int` radius of the circle| 
| `color` | `int` color of the circle, which is either `WHITE` or `BLACK`|
###fillCircle  
`SSD1306.fillCircle(x, y, r, color)`  
#####Description
Fills a `color` circle centered at `(x,y)` with radius `r`.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x` | `int` x-coordinate of the circle| 
| `y` | `int` y-coordinate of the circle| 
| `r` | `int` radius of the circle| 
| `color` | `int` color of the circle, which is either `WHITE` or `BLACK`|
###println
`SSD1306.println(text)`  
#####Description
Writes `text` to the screen followed by a new line at the current cursor position, or just a new line if `text` is `undefined`. Text automatically wraps.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `text` | `string` text to render | 

###print
`SSD1306.print(text)`  
#####Description
Writes `text` to the screen. Text automatically wraps.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `text` | `string` text to render | 

###drawBitmap
`SSD1306.drawBitmap(x, y, bitmap, w, h, color, bgcolor)`  
#####Description
Draws a `bitmap` of dimensions `w`x`h` at `(x,y)` with `color` as the foreground color and `bgcolor` as the background color. 
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x` | `int` x-coordinate of the image| 
| `y` | `int` y-coordinate of the image|
| `bitmap` | `array` array or chunk of the bitmap data|
| `w` | `int` width of the image|
| `h` | `int` height of the image|
| `color` | `int` color of the foreground, which is either `WHITE` or `BLACK`|
| `bgcolor` | `int` (optional) color of the background, which is either `WHITE` or `BLACK`|

###drawXBitmap
`SSD1306.drawXBitmap(x, y, bitmap, w, h, color, bgcolor)`  
#####Description
Draws a `bitmap` of dimensions `w`x`h` at `(x,y)` with `color` as the foreground color and `bgcolor` as the background color. The only difference with `drawBitmap` is that this function is specifically designed for the `.xbm` files of gimp.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x` | `int` x-coordinate of the image| 
| `y` | `int` y-coordinate of the image|
| `bitmap` | `array` array or chunk of the bitmap data|
| `w` | `int` width of the image|
| `h` | `int` height of the image|
| `color` | `int` color of the foreground, which is either `WHITE` or `BLACK`|
| `bgcolor` | `int` (optional) color of the background, which is either `WHITE` or `BLACK`|
###drawLine
`SSD1306.drawLine(x0, y0, x1, y1, color)`
#####Description
Draws a line from point `(x0, y0)` to `(x1, y1)` with `color`.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- | 
| `x0` | `int` x-coordinate of the initial point| 
| `y0` | `int` y-coordinate of the initial point|
| `x1` | `int` x-coordinate of the final point| 
| `y1` | `int` y-coordinate of the final point|
| `color` | `int` color of the line, which is either `WHITE` or `BLACK`|

###drawRect
`SSD1306.drawRect(x, y, w, h, color)`  
#####Description
Draws the border of a rectangle
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x` | `int` x-coord of rectangle|
| `y` | `int` y-coord of rectangle|
| `w` | `int` width of rectangle|
| `h` | `int` height of rectangle|
| `color` | `int` color of the rectangle, which is either `WHITE` or `BLACK`|
###fillRect
`SSD1306.fillRect(x, y, w, h, color)`  
#####Description
Fills in a rectangle
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x` | `int` x-coord of rectangle|
| `y` | `int` y-coord of rectangle|
| `w` | `int` width of rectangle|
| `h` | `int` height of rectangle|
| `color` | `int` color of the rectangle, which is either `WHITE` or `BLACK`|
###drawRoundRect
`SSD1306.drawRect(x, y, w, h, r, color)`  
#####Description
Draws the border of a rounded rectangle
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x` | `int` x-coord of rectangle|
| `y` | `int` y-coord of rectangle|
| `w` | `int` width of rectangle|
| `h` | `int` height of rectangle|
| `r` | `int` radius of rounded corners|
| `color` | `int` color of the rectangle, which is either `WHITE` or `BLACK`|
###fillRoundRect
`SSD1306.fillRect(x, y, w, h, r, color)`  
#####Description
Fills in a rounded rectangle
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x` | `int` x-coord of rectangle|
| `y` | `int` y-coord of rectangle|
| `w` | `int` width of rectangle|
| `h` | `int` height of rectangle|
| `r` | `int` radius of rounded corners|
| `color` | `int` color of the rectangle, which is either `WHITE` or `BLACK`|

###drawTriangle
`SSD1306.drawTriangle(x0, y0, x1, y1, x2, y2, color)`  
#####Description
Draws a `color` triangle using the 3 given points.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x0` | `int` x-coord first point |
| `y0` | `int` y-coord first point|
| `x1` | `int` x-coord second point|
| `y1` | `int` y-coord second point|
| `x2` | `int` x-coord third point|
| `y2` | `int` y-coord third point|
| `color` | `int` color of the triangle, which is either `WHITE` or `BLACK`|
###fillTriangle
`SSD1306.fillTriangle(x0, y0, x1, y1, x2, y2, color)`  
#####Description
Fills a `color` triangle using the 3 given points.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x0` | `int` x-coord first point |
| `y0` | `int` y-coord first point|
| `x1` | `int` x-coord second point|
| `y1` | `int` y-coord second point|
| `x2` | `int` x-coord third point|
| `y2` | `int` y-coord third point|
| `color` | `int` color of the triangle, which is either `WHITE` or `BLACK`|

###setCursor
`SSD1306.setCursor(x, y)`  
#####Description
Sets the cursor at the specified `(x,y)` location, which determines where `print` and `println` start writing to.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `x` | `int` x-coord of cursor |
| `y` | `int` y-coord of cursor |

###setTextSize
`SSD1306.setTextSize(s)`  
#####Description
Sets the size of the font. Recommended not to exceed 4.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `s` | `int` Size of the font. Defaults to 1, the smallest.|

###setTextColor
`SSD1306.setTextColor(c, b)`  
#####Description
Sets the foreground and background text colors. Useful for writing inverse text (black text on a white background
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `c` | `int` foreground color|
| `b` | `int` background color |

###invertDisplay
`SSD1306.invertDisplay(invert)`  
#####Description
Inverts the display, or returns it back to normal.
#####Parameters
| Parameter | Description | 
| ------------ | ------------- |
| `invert` | `boolean` whether the screen should be inverted or normal|

###startscrollleft (and variations)
`SSD1306.startscrollleft(start, stop)`  
#####Description
Causes the display to start scrolling in a certain direction. This is not a draw command, so it takes effect immediately. Cancel with `stopscroll`.
Other variations (same syntax):

 * `startscrollright`
 * `startscrolldiagright`
 * `startscrolldiagleft`
 
#####Parameters

| Parameter | Description | 
| ------------ | ------------- |
| `start` | `int` Refer to the example for the correct value |
| `stop` | `int` Refer to the example for the correct value|
#####Example
```
//taken from https://github.com/adafruit/Adafruit_SSD1306
display.startscrollright(0x00, 0x0F);
delay(2000); //doesn't exist in KinomaJS but left in for illustration
display.stopscroll();
delay(1000);
display.startscrollleft(0x00, 0x0F);
delay(2000);
display.stopscroll();
delay(1000);    
display.startscrolldiagright(0x00, 0x07);
delay(2000);
display.startscrolldiagleft(0x00, 0x07);
delay(2000);
display.stopscroll();
```
###stopscroll
`SSD1306.stopscroll()`  
#####Description
Terminates any active scrolling.

##Misc
[SSD1306 Datasheet](http://www.adafruit.com/datasheets/SSD1306.pdf)