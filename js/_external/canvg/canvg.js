/**
 * A class to parse color values
 * @author Stoyan Stefanov <sstoo@gmail.com>
 * @link   http://www.phpied.com/rgb-color-parser-in-javascript/
 * @license Use it if you like it
 */

(function (global) {

	function RGBColor(color_string) {
		this.ok = false;

		// strip any leading #
		if (color_string.charAt(0) == '#') { // remove # if any
			color_string = color_string.substr(1,6);
		}

		color_string = color_string.replace(/ /g,'');
		color_string = color_string.toLowerCase();

		// before getting into regexps, try simple matches
		// and overwrite the input
		const simple_colors = {
			aliceblue: 'f0f8ff',
			antiquewhite: 'faebd7',
			aqua: '00ffff',
			aquamarine: '7fffd4',
			azure: 'f0ffff',
			beige: 'f5f5dc',
			bisque: 'ffe4c4',
			black: '000000',
			blanchedalmond: 'ffebcd',
			blue: '0000ff',
			blueviolet: '8a2be2',
			brown: 'a52a2a',
			burlywood: 'deb887',
			cadetblue: '5f9ea0',
			chartreuse: '7fff00',
			chocolate: 'd2691e',
			coral: 'ff7f50',
			cornflowerblue: '6495ed',
			cornsilk: 'fff8dc',
			crimson: 'dc143c',
			cyan: '00ffff',
			darkblue: '00008b',
			darkcyan: '008b8b',
			darkgoldenrod: 'b8860b',
			darkgray: 'a9a9a9',
			darkgreen: '006400',
			darkkhaki: 'bdb76b',
			darkmagenta: '8b008b',
			darkolivegreen: '556b2f',
			darkorange: 'ff8c00',
			darkorchid: '9932cc',
			darkred: '8b0000',
			darksalmon: 'e9967a',
			darkseagreen: '8fbc8f',
			darkslateblue: '483d8b',
			darkslategray: '2f4f4f',
			darkturquoise: '00ced1',
			darkviolet: '9400d3',
			deeppink: 'ff1493',
			deepskyblue: '00bfff',
			dimgray: '696969',
			dodgerblue: '1e90ff',
			feldspar: 'd19275',
			firebrick: 'b22222',
			floralwhite: 'fffaf0',
			forestgreen: '228b22',
			fuchsia: 'ff00ff',
			gainsboro: 'dcdcdc',
			ghostwhite: 'f8f8ff',
			gold: 'ffd700',
			goldenrod: 'daa520',
			gray: '808080',
			green: '008000',
			greenyellow: 'adff2f',
			honeydew: 'f0fff0',
			hotpink: 'ff69b4',
			indianred : 'cd5c5c',
			indigo : '4b0082',
			ivory: 'fffff0',
			khaki: 'f0e68c',
			lavender: 'e6e6fa',
			lavenderblush: 'fff0f5',
			lawngreen: '7cfc00',
			lemonchiffon: 'fffacd',
			lightblue: 'add8e6',
			lightcoral: 'f08080',
			lightcyan: 'e0ffff',
			lightgoldenrodyellow: 'fafad2',
			lightgrey: 'd3d3d3',
			lightgreen: '90ee90',
			lightpink: 'ffb6c1',
			lightsalmon: 'ffa07a',
			lightseagreen: '20b2aa',
			lightskyblue: '87cefa',
			lightslateblue: '8470ff',
			lightslategray: '778899',
			lightsteelblue: 'b0c4de',
			lightyellow: 'ffffe0',
			lime: '00ff00',
			limegreen: '32cd32',
			linen: 'faf0e6',
			magenta: 'ff00ff',
			maroon: '800000',
			mediumaquamarine: '66cdaa',
			mediumblue: '0000cd',
			mediumorchid: 'ba55d3',
			mediumpurple: '9370d8',
			mediumseagreen: '3cb371',
			mediumslateblue: '7b68ee',
			mediumspringgreen: '00fa9a',
			mediumturquoise: '48d1cc',
			mediumvioletred: 'c71585',
			midnightblue: '191970',
			mintcream: 'f5fffa',
			mistyrose: 'ffe4e1',
			moccasin: 'ffe4b5',
			navajowhite: 'ffdead',
			navy: '000080',
			oldlace: 'fdf5e6',
			olive: '808000',
			olivedrab: '6b8e23',
			orange: 'ffa500',
			orangered: 'ff4500',
			orchid: 'da70d6',
			palegoldenrod: 'eee8aa',
			palegreen: '98fb98',
			paleturquoise: 'afeeee',
			palevioletred: 'd87093',
			papayawhip: 'ffefd5',
			peachpuff: 'ffdab9',
			peru: 'cd853f',
			pink: 'ffc0cb',
			plum: 'dda0dd',
			powderblue: 'b0e0e6',
			purple: '800080',
			red: 'ff0000',
			rosybrown: 'bc8f8f',
			royalblue: '4169e1',
			saddlebrown: '8b4513',
			salmon: 'fa8072',
			sandybrown: 'f4a460',
			seagreen: '2e8b57',
			seashell: 'fff5ee',
			sienna: 'a0522d',
			silver: 'c0c0c0',
			skyblue: '87ceeb',
			slateblue: '6a5acd',
			slategray: '708090',
			snow: 'fffafa',
			springgreen: '00ff7f',
			steelblue: '4682b4',
			tan: 'd2b48c',
			teal: '008080',
			thistle: 'd8bfd8',
			tomato: 'ff6347',
			turquoise: '40e0d0',
			violet: 'ee82ee',
			violetred: 'd02090',
			wheat: 'f5deb3',
			white: 'ffffff',
			whitesmoke: 'f5f5f5',
			yellow: 'ffff00',
			yellowgreen: '9acd32',
		};

		for (const key in simple_colors) {
			if (color_string == key) {
				color_string = simple_colors[key];
			}
		}
		// emd of simple type-in colors

		// array of color definition objects
		const color_defs = [
			{
				re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
				example: ['rgb(123, 234, 45)', 'rgb(255,234,245)'],
				process: function (bits) {
					return [
						parseInt(bits[1]),
						parseInt(bits[2]),
						parseInt(bits[3]),
					];
				},
			},
			{
				re: /^(\w{2})(\w{2})(\w{2})$/,
				example: ['#00ff00', '336699'],
				process: function (bits) {
					return [
						parseInt(bits[1], 16),
						parseInt(bits[2], 16),
						parseInt(bits[3], 16),
					];
				},
			},
			{
				re: /^(\w{1})(\w{1})(\w{1})$/,
				example: ['#fb0', 'f0f'],
				process: function (bits) {
					return [
						parseInt(bits[1] + bits[1], 16),
						parseInt(bits[2] + bits[2], 16),
						parseInt(bits[3] + bits[3], 16),
					];
				},
			},
		];

		// search through the definitions to find a match
		for (let i = 0; i < color_defs.length; i++) {
			const re = color_defs[i].re;
			const processor = color_defs[i].process;
			const bits = re.exec(color_string);


			if (bits) {
				channels = processor(bits);
				this.r = channels[0];
				this.g = channels[1];
				this.b = channels[2];
				this.ok = true;
			}

		}

		// validate/cleanup values
		this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
		this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
		this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);

		// some getters
		this.toRGB = function () {
			return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
		};
		this.toHex = function () {
			let r = this.r.toString(16);
			let g = this.g.toString(16);
			let b = this.b.toString(16);


			if (r.length == 1) r = '0' + r;

			if (g.length == 1) g = '0' + g;

			if (b.length == 1) b = '0' + b;

			return '#' + r + g + b;
		};

		// help
		this.getHelpXML = function () {

			const examples = new Array();
			// add regexps

			for (var i = 0; i < color_defs.length; i++) {
				const example = color_defs[i].example;

				for (let j = 0; j < example.length; j++) {
					examples[examples.length] = example[j];
				}
			}
			// add type-in colors
			for (const sc in simple_colors) {
				examples[examples.length] = sc;
			}

			const xml = document.createElement('ul');

			xml.setAttribute('id', 'rgbcolor-examples');
			for (var i = 0; i < examples.length; i++) {
				try {
					const list_item = document.createElement('li');
					const list_color = new RGBColor(examples[i]);
					const example_div = document.createElement('div');

					example_div.style.cssText
              = 'margin: 3px; '
              + 'border: 1px solid black; '
              + 'background:' + list_color.toHex() + '; '
              + 'color:' + list_color.toHex()
					;
					example_div.appendChild(document.createTextNode('test'));
					const list_item_value = document.createTextNode(
						' ' + examples[i] + ' -> ' + list_color.toRGB() + ' -> ' + list_color.toHex()
					);

					list_item.appendChild(example_div);
					list_item.appendChild(list_item_value);
					xml.appendChild(list_item);

				} catch (e) {}
			}
			return xml;

		};

	}

	// export as AMD...
	if (typeof define !== 'undefined' && define.amd) {
		define(function () {
			return RGBColor;
		});
	}

	// ...or as browserify
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = RGBColor;
	}

	global.RGBColor = RGBColor;

}(typeof window !== 'undefined' ? window : this));



/*

StackBlur - a fast almost Gaussian Blur For Canvas

Version:  0.5
Author:   Mario Klingemann
Contact:  mario@quasimondo.com
Website:  http://www.quasimondo.com/StackBlurForCanvas
Twitter:  @quasimondo

In case you find this class useful - especially in commercial projects -
I am not totally unhappy for a small donation to my PayPal account
mario@quasimondo.de

Or support me on flattr:
https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

Copyright (c) 2010 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

(function (global) {

	const mul_table = [
		512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
		454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
		482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
		437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
		497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
		320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
		446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
		329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
		505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
		399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
		324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
		268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
		451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
		385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
		332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
		289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];


	const shg_table = [
		9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];

	function premultiplyAlpha(imageData) {
		const pixels = imageData.data;
		const size = imageData.width * imageData.height * 4;

		for (let i=0; i<size; i+=4) {
			const a = pixels[i+3] / 255;

			pixels[i  ] *= a;
			pixels[i+1] *= a;
			pixels[i+2] *= a;
		}
	}

	function unpremultiplyAlpha(imageData) {
		const pixels = imageData.data;
		const size = imageData.width * imageData.height * 4;

		for (let i=0; i<size; i+=4) {
			let a = pixels[i+3];


			if (a != 0) {
				a = 255 / a;
				pixels[i  ] *= a;
				pixels[i+1] *= a;
				pixels[i+2] *= a;
			}
		}
	}

	function stackBlurImage(imageID, canvasID, radius, blurAlphaChannel) {

		const img = document.getElementById(imageID);
		const w = img.naturalWidth;
		const h = img.naturalHeight;

		const canvas = document.getElementById(canvasID);

		canvas.style.width  = w + "px";
		canvas.style.height = h + "px";
		canvas.width = w;
		canvas.height = h;

		const context = canvas.getContext("2d");

		context.clearRect(0, 0, w, h);
		context.drawImage(img, 0, 0);

		if (isNaN(radius) || radius < 1) return;

		if (blurAlphaChannel)
			stackBlurCanvasRGBA(canvasID, 0, 0, w, h, radius);
		else
			stackBlurCanvasRGB(canvasID, 0, 0, w, h, radius);
	}


	function stackBlurCanvasRGBA(id, top_x, top_y, width, height, radius) {
		if (isNaN(radius) || radius < 1) return;

		radius |= 0;

		const canvas  = document.getElementById(id);
		const context = canvas.getContext("2d");
		let imageData;

		try {
			try {
				imageData = context.getImageData(top_x, top_y, width, height);
			} catch (e) {

				// NOTE: this part is supposedly only needed if you want to work with local files
				// so it might be okay to remove the whole try/catch block and just use
				// imageData = context.getImageData( top_x, top_y, width, height );
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					imageData = context.getImageData(top_x, top_y, width, height);
				} catch (e) {
					alert("Cannot access local image");
					throw new Error("unable to access local image data: " + e);
					return;
				}
			}
		} catch (e) {
			alert("Cannot access image");
			throw new Error("unable to access image data: " + e);
		}

		premultiplyAlpha(imageData);

		const pixels = imageData.data;

		let x; let y; let i; let p; let yp; let yi; let yw; let r_sum; let g_sum; let b_sum; let a_sum;
		let r_out_sum; let g_out_sum; let b_out_sum; let a_out_sum;
		let r_in_sum; let g_in_sum; let b_in_sum; let a_in_sum;
		let pr; let pg; let pb; let pa; let rbs;

		const div = radius + radius + 1;
		const w4 = width << 2;
		const widthMinus1  = width - 1;
		const heightMinus1 = height - 1;
		const radiusPlus1  = radius + 1;
		const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

		const stackStart = new BlurStack();
		let stack = stackStart;

		for (i = 1; i < div; i++) {
			stack = stack.next = new BlurStack();

			if (i == radiusPlus1) var stackEnd = stack;
		}
		stack.next = stackStart;
		let stackIn = null;
		let stackOut = null;

		yw = yi = 0;

		const mul_sum = mul_table[radius];
		const shg_sum = shg_table[radius];

		for (y = 0; y < height; y++) {
			r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
			a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			for (i = 1; i < radiusPlus1; i++) {
				p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
				r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[p+2])) * rbs;
				a_sum += (stack.a = (pa = pixels[p+3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;
			}

			stackIn = stackStart;
			stackOut = stackEnd;
			for (x = 0; x < width; x++) {
				pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
				pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;
				pixels[yi+3] = (a_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

				r_in_sum += (stackIn.r = pixels[p]);
				g_in_sum += (stackIn.g = pixels[p+1]);
				b_in_sum += (stackIn.b = pixels[p+2]);
				a_in_sum += (stackIn.a = pixels[p+3]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;
				a_sum += a_in_sum;

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for (x = 0; x < width; x++) {
			g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);
			a_out_sum = radiusPlus1 * (pa = pixels[yi+3]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;
			a_sum += sumFactor * pa;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack.a = pa;
				stack = stack.next;
			}

			yp = width;

			for (i = 1; i <= radius; i++) {
				yi = (yp + x) << 2;

				r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;
				a_sum += (stack.a = (pa = pixels[yi+3])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;
				a_in_sum += pa;

				stack = stack.next;

				if (i < heightMinus1) {
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for (y = 0; y < height; y++) {
				p = yi << 2;
				pixels[p]   = (r_sum * mul_sum) >> shg_sum;
				pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[p+2] = (b_sum * mul_sum) >> shg_sum;
				pixels[p+3] = (a_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;
				a_sum -= a_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;
				a_out_sum -= stackIn.a;

				p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

				r_sum += (r_in_sum += (stackIn.r = pixels[p]));
				g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
				b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));
				a_sum += (a_in_sum += (stackIn.a = pixels[p+3]));

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);
				a_out_sum += (pa = stackOut.a);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;
				a_in_sum -= pa;

				stackOut = stackOut.next;

				yi += width;
			}
		}

		unpremultiplyAlpha(imageData);

		context.putImageData(imageData, top_x, top_y);
	}


	function stackBlurCanvasRGB(id, top_x, top_y, width, height, radius) {
		if (isNaN(radius) || radius < 1) return;

		radius |= 0;

		const canvas  = document.getElementById(id);
		const context = canvas.getContext("2d");
		let imageData;

		try {
			try {
				imageData = context.getImageData(top_x, top_y, width, height);
			} catch (e) {

				// NOTE: this part is supposedly only needed if you want to work with local files
				// so it might be okay to remove the whole try/catch block and just use
				// imageData = context.getImageData( top_x, top_y, width, height );
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					imageData = context.getImageData(top_x, top_y, width, height);
				} catch (e) {
					alert("Cannot access local image");
					throw new Error("unable to access local image data: " + e);
					return;
				}
			}
		} catch (e) {
			alert("Cannot access image");
			throw new Error("unable to access image data: " + e);
		}

		const pixels = imageData.data;

		let x; let y; let i; let p; let yp; let yi; let yw; let r_sum; let g_sum; let b_sum;
		let r_out_sum; let g_out_sum; let b_out_sum;
		let r_in_sum; let g_in_sum; let b_in_sum;
		let pr; let pg; let pb; let rbs;

		const div = radius + radius + 1;
		const w4 = width << 2;
		const widthMinus1  = width - 1;
		const heightMinus1 = height - 1;
		const radiusPlus1  = radius + 1;
		const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

		const stackStart = new BlurStack();
		let stack = stackStart;

		for (i = 1; i < div; i++) {
			stack = stack.next = new BlurStack();

			if (i == radiusPlus1) var stackEnd = stack;
		}
		stack.next = stackStart;
		let stackIn = null;
		let stackOut = null;

		yw = yi = 0;

		const mul_sum = mul_table[radius];
		const shg_sum = shg_table[radius];

		for (y = 0; y < height; y++) {
			r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;

			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			for (i = 1; i < radiusPlus1; i++) {
				p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
				r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[p+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[p+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;
			}


			stackIn = stackStart;
			stackOut = stackEnd;
			for (x = 0; x < width; x++) {
				pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
				pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p =  (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

				r_in_sum += (stackIn.r = pixels[p]);
				g_in_sum += (stackIn.g = pixels[p+1]);
				b_in_sum += (stackIn.b = pixels[p+2]);

				r_sum += r_in_sum;
				g_sum += g_in_sum;
				b_sum += b_in_sum;

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += 4;
			}
			yw += width;
		}


		for (x = 0; x < width; x++) {
			g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

			yi = x << 2;
			r_out_sum = radiusPlus1 * (pr = pixels[yi]);
			g_out_sum = radiusPlus1 * (pg = pixels[yi+1]);
			b_out_sum = radiusPlus1 * (pb = pixels[yi+2]);

			r_sum += sumFactor * pr;
			g_sum += sumFactor * pg;
			b_sum += sumFactor * pb;

			stack = stackStart;

			for (i = 0; i < radiusPlus1; i++) {
				stack.r = pr;
				stack.g = pg;
				stack.b = pb;
				stack = stack.next;
			}

			yp = width;

			for (i = 1; i <= radius; i++) {
				yi = (yp + x) << 2;

				r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
				g_sum += (stack.g = (pg = pixels[yi+1])) * rbs;
				b_sum += (stack.b = (pb = pixels[yi+2])) * rbs;

				r_in_sum += pr;
				g_in_sum += pg;
				b_in_sum += pb;

				stack = stack.next;

				if (i < heightMinus1) {
					yp += width;
				}
			}

			yi = x;
			stackIn = stackStart;
			stackOut = stackEnd;
			for (y = 0; y < height; y++) {
				p = yi << 2;
				pixels[p]   = (r_sum * mul_sum) >> shg_sum;
				pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
				pixels[p+2] = (b_sum * mul_sum) >> shg_sum;

				r_sum -= r_out_sum;
				g_sum -= g_out_sum;
				b_sum -= b_out_sum;

				r_out_sum -= stackIn.r;
				g_out_sum -= stackIn.g;
				b_out_sum -= stackIn.b;

				p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

				r_sum += (r_in_sum += (stackIn.r = pixels[p]));
				g_sum += (g_in_sum += (stackIn.g = pixels[p+1]));
				b_sum += (b_in_sum += (stackIn.b = pixels[p+2]));

				stackIn = stackIn.next;

				r_out_sum += (pr = stackOut.r);
				g_out_sum += (pg = stackOut.g);
				b_out_sum += (pb = stackOut.b);

				r_in_sum -= pr;
				g_in_sum -= pg;
				b_in_sum -= pb;

				stackOut = stackOut.next;

				yi += width;
			}
		}

		context.putImageData(imageData, top_x, top_y);

	}

	function BlurStack() {
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.a = 0;
		this.next = null;
	}

	const stackBlur = {
		image: stackBlurImage,
		canvasRGBA: stackBlurCanvasRGBA,
		canvasRGB: stackBlurCanvasRGB,
	};

	// export as AMD...
	if (typeof define !== 'undefined' && define.amd) {
		define(function () {
			return stackBlur;
		});
	}

	// ...or as browserify
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = stackBlur;
	}

	global.stackBlur = stackBlur;

}(typeof window !== 'undefined' ? window : this));



/*
 * canvg.js - Javascript SVG parser and renderer on Canvas
 * MIT Licensed
 * Gabe Lerner (gabelerner@gmail.com)
 * http://code.google.com/p/canvg/
 *
 * Requires: rgbcolor.js - http://www.phpied.com/rgb-color-parser-in-javascript/
 */
(function (global, factory) {

	'use strict';

	// export as AMD...
	if (typeof define !== 'undefined' && define.amd) {
		define('canvgModule', [ 'rgbcolor', 'stackblur' ], factory);
	}

	// ...or as browserify
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require('rgbcolor'), require('stackblur'));
	}

	global.canvg = factory(global.RGBColor, global.stackBlur);

}(typeof window !== 'undefined' ? window : this, function (RGBColor, stackBlur) {

	// canvg(target, s)
	// empty parameters: replace all 'svg' elements on page with 'canvas' elements
	// target: canvas element or the id of a canvas element
	// s: svg string, url to svg file, or xml document
	// opts: optional hash of options
	//     ignoreMouse: true => ignore mouse events
	//     ignoreAnimation: true => ignore animations
	//     ignoreDimensions: true => does not try to resize canvas
	//     ignoreClear: true => does not clear canvas
	//     offsetX: int => draws at a x offset
	//     offsetY: int => draws at a y offset
	//     scaleWidth: int => scales horizontally to width
	//     scaleHeight: int => scales vertically to height
	//     renderCallback: function => will call the function after the first render is completed
	//     forceRedraw: function => will call the function on every frame, if it returns true, will redraw
	var canvg = function (target, s, opts) {
		// no parameters
		if (target == null && s == null && opts == null) {
			const svgTags = document.querySelectorAll('svg');

			for (let i=0; i<svgTags.length; i++) {
				const svgTag = svgTags[i];
				const c = document.createElement('canvas');

				c.width = svgTag.clientWidth;
				c.height = svgTag.clientHeight;
				svgTag.parentNode.insertBefore(c, svgTag);
				svgTag.parentNode.removeChild(svgTag);
				const div = document.createElement('div');

				div.appendChild(svgTag);
				canvg(c, div.innerHTML);
			}
			return;
		}

		if (typeof target === 'string') {
			target = document.getElementById(target);
		}

		// store class on canvas
		if (target.svg != null) target.svg.stop();

		const svg = build(opts || {});

		// on i.e. 8 for flash canvas, we can't assign the property so check for it

		if (!(target.childNodes.length == 1 && target.childNodes[0].nodeName == 'OBJECT')) target.svg = svg;

		const ctx = target.getContext('2d');


		if (typeof s.documentElement !== 'undefined') {
			// load from xml doc
			svg.loadXmlDoc(ctx, s);
		} else if (s.substr(0,1) == '<') {
			// load from xml string
			svg.loadXml(ctx, s);
		} else {
			// load from url
			svg.load(ctx, s);
		}
	};

	// see https://developer.mozilla.org/en-US/docs/Web/API/Element.matches
	let matchesSelector;


	if (typeof Element.prototype.matches !== 'undefined') {
		matchesSelector = function (node, selector) {
			return node.matches(selector);
		};
	} else if (typeof Element.prototype.webkitMatchesSelector !== 'undefined') {
		matchesSelector = function (node, selector) {
			return node.webkitMatchesSelector(selector);
		};
	} else if (typeof Element.prototype.mozMatchesSelector !== 'undefined') {
		matchesSelector = function (node, selector) {
			return node.mozMatchesSelector(selector);
		};
	} else if (typeof Element.prototype.msMatchesSelector !== 'undefined') {
		matchesSelector = function (node, selector) {
			return node.msMatchesSelector(selector);
		};
	} else if (typeof Element.prototype.oMatchesSelector !== 'undefined') {
		matchesSelector = function (node, selector) {
			return node.oMatchesSelector(selector);
		};
	} else {
		// requires Sizzle: https://github.com/jquery/sizzle/wiki/Sizzle-Documentation
		// or jQuery: http://jquery.com/download/
		// or Zepto: http://zeptojs.com/#
		// without it, this is a ReferenceError

		if (typeof jQuery === 'function' || typeof Zepto === 'function') {
			matchesSelector = function (node, selector) {
				return $(node).is(selector);
			};
		}

		if (typeof matchesSelector === 'undefined') {
			matchesSelector = Sizzle.matchesSelector;
		}
	}

	// slightly modified version of https://github.com/keeganstreet/specificity/blob/master/specificity.js
	const attributeRegex = /(\[[^\]]+\])/g;
	const idRegex = /(#[^\s\+>~\.\[:]+)/g;
	const classRegex = /(\.[^\s\+>~\.\[:]+)/g;
	const pseudoElementRegex = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/gi;
	const pseudoClassWithBracketsRegex = /(:[\w-]+\([^\)]*\))/gi;
	const pseudoClassRegex = /(:[^\s\+>~\.\[:]+)/g;
	const elementRegex = /([^\s\+>~\.\[:]+)/g;

	function getSelectorSpecificity(selector) {
		const typeCount = [0, 0, 0];
		const findMatch = function (regex, type) {
			const matches = selector.match(regex);


			if (matches == null) {
				return;
			}

			typeCount[type] += matches.length;
			selector = selector.replace(regex, ' ');
		};

		selector = selector.replace(/:not\(([^\)]*)\)/g, '     $1 ');
		selector = selector.replace(/{[\s\S]*/gm, ' ');
		findMatch(attributeRegex, 1);
		findMatch(idRegex, 0);
		findMatch(classRegex, 1);
		findMatch(pseudoElementRegex, 2);
		findMatch(pseudoClassWithBracketsRegex, 1);
		findMatch(pseudoClassRegex, 1);
		selector = selector.replace(/[\*\s\+>~]/g, ' ');
		selector = selector.replace(/[#\.]/g, ' ');
		findMatch(elementRegex, 2);
		return typeCount.join('');
	}

	function build(opts) {
		const svg = { opts: opts };

		svg.FRAMERATE = 30;
		svg.MAX_VIRTUAL_PIXELS = 30000;

		svg.log = function (msg) {};

		if (svg.opts['log'] == true && typeof console !== 'undefined') {
			svg.log = function (msg) {
				console.log(msg);
			};
		}

		;

		// globals
		svg.init = function (ctx) {
			let uniqueId = 0;

			svg.UniqueId = function () {
				uniqueId++; return 'canvg' + uniqueId;
			};
			svg.Definitions = {};
			svg.Styles = {};
			svg.StylesSpecificity = {};
			svg.Animations = [];
			svg.Images = [];
			svg.ctx = ctx;
			svg.ViewPort = new (function () {
				this.viewPorts = [];
				this.Clear = function () {
					this.viewPorts = [];
				};
				this.SetCurrent = function (width, height) {
					this.viewPorts.push({ width: width, height: height });
				};
				this.RemoveCurrent = function () {
					this.viewPorts.pop();
				};
				this.Current = function () {
					return this.viewPorts[this.viewPorts.length - 1];
				};
				this.width = function () {
					return this.Current().width;
				};
				this.height = function () {
					return this.Current().height;
				};
				this.ComputeSize = function (d) {
					if (d != null && typeof d === 'number') return d;

					if (d == 'x') return this.width();

					if (d == 'y') return this.height();

					return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2)) / Math.sqrt(2);
				};
			});
		};
		svg.init();

		// images loaded
		svg.ImagesLoaded = function () {
			for (let i=0; i<svg.Images.length; i++) {
				if (!svg.Images[i].loaded) return false;
			}
			return true;
		};

		// trim
		svg.trim = function (s) {
			return s.replace(/^\s+|\s+$/g, '');
		};

		// compress spaces
		svg.compressSpaces = function (s) {
			return s.replace(/[\s\r\t\n]+/gm,' ');
		};

		// ajax
		svg.ajax = function (url) {
			let AJAX;


			if (window.XMLHttpRequest) {
				AJAX=new XMLHttpRequest();
			} else {
				AJAX=new ActiveXObject('Microsoft.XMLHTTP');
			}

			if (AJAX) {
				AJAX.open('GET',url,false);
				AJAX.send(null);
				return AJAX.responseText;
			}

			return null;
		};

		// parse xml
		svg.parseXml = function (xml) {
			if (typeof Windows !== 'undefined' && typeof Windows.Data !== 'undefined' && typeof Windows.Data.Xml !== 'undefined') {
				var xmlDoc = new Windows.Data.Xml.Dom.XmlDocument();
				const settings = new Windows.Data.Xml.Dom.XmlLoadSettings();

				settings.prohibitDtd = false;
				xmlDoc.loadXml(xml, settings);
				return xmlDoc;
			} else if (window.DOMParser) {
				try {
					var parser = new DOMParser();

					return parser.parseFromString(xml, 'image/svg+xml');
				} catch (e) {
					parser = new DOMParser();
					return parser.parseFromString(xml, 'text/xml');
				}
			} else {
				xml = xml.replace(/<!DOCTYPE svg[^>]*>/, '');
				var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');

				xmlDoc.async = 'false';
				xmlDoc.loadXML(xml);
				return xmlDoc;
			}
		};

		svg.Property = function (name, value) {
			this.name = name;
			this.value = value;
		};
		svg.Property.prototype.getValue = function () {
			return this.value;
		};

		svg.Property.prototype.hasValue = function () {
			return (this.value != null && this.value !== '');
		};

		// return the numerical value of the property
		svg.Property.prototype.numValue = function () {
			if (!this.hasValue()) return 0;

			let n = parseFloat(this.value);


			if ((this.value + '').match(/%$/)) {
				n = n / 100.0;
			}

			return n;
		};

		svg.Property.prototype.valueOrDefault = function (def) {
			if (this.hasValue()) return this.value;

			return def;
		};

		svg.Property.prototype.numValueOrDefault = function (def) {
			if (this.hasValue()) return this.numValue();

			return def;
		};

		// color extensions
		// augment the current color value with the opacity
		svg.Property.prototype.addOpacity = function (opacityProp) {
			let newValue = this.value;


			if (opacityProp.value != null && opacityProp.value != '' && typeof this.value === 'string') { // can only add opacity to colors, not patterns
				const color = new RGBColor(this.value);


				if (color.ok) {
					newValue = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + opacityProp.numValue() + ')';
				}
			}

			return new svg.Property(this.name, newValue);
		};

		// definition extensions
		// get the definition from the definitions table
		svg.Property.prototype.getDefinition = function () {
			let name = this.value.match(/#([^\)'"]+)/);


			if (name) {
				name = name[1];
			}

			if (!name) {
				name = this.value;
			}

			return svg.Definitions[name];
		};

		svg.Property.prototype.isUrlDefinition = function () {
			return this.value.indexOf('url(') == 0;
		};

		svg.Property.prototype.getFillStyleDefinition = function (e, opacityProp) {
			let def = this.getDefinition();

			// gradient
			if (def != null && def.createGradient) {
				return def.createGradient(svg.ctx, e, opacityProp);
			}

			// pattern
			if (def != null && def.createPattern) {
				if (def.getHrefAttribute().hasValue()) {
					const pt = def.attribute('patternTransform');

					def = def.getHrefAttribute().getDefinition();

					if (pt.hasValue()) {
						def.attribute('patternTransform', true).value = pt.value;
					}
				}

				return def.createPattern(svg.ctx, e);
			}

			return null;
		};

		// length extensions
		svg.Property.prototype.getDPI = function (viewPort) {
			return 96.0;
		};

		svg.Property.prototype.getEM = function (viewPort) {
			let em = 12;

			const fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);


			if (fontSize.hasValue()) em = fontSize.toPixels(viewPort);

			return em;
		};

		svg.Property.prototype.getUnits = function () {
			const s = this.value+'';

			return s.replace(/[0-9\.\-]/g,'');
		};

		// get the length as pixels
		svg.Property.prototype.toPixels = function (viewPort, processPercent) {
			if (!this.hasValue()) return 0;

			const s = this.value+'';


			if (s.match(/em$/)) return this.numValue() * this.getEM(viewPort);

			if (s.match(/ex$/)) return this.numValue() * this.getEM(viewPort) / 2.0;

			if (s.match(/px$/)) return this.numValue();

			if (s.match(/pt$/)) return this.numValue() * this.getDPI(viewPort) * (1.0 / 72.0);

			if (s.match(/pc$/)) return this.numValue() * 15;

			if (s.match(/cm$/)) return this.numValue() * this.getDPI(viewPort) / 2.54;

			if (s.match(/mm$/)) return this.numValue() * this.getDPI(viewPort) / 25.4;

			if (s.match(/in$/)) return this.numValue() * this.getDPI(viewPort);

			if (s.match(/%$/)) return this.numValue() * svg.ViewPort.ComputeSize(viewPort);

			const n = this.numValue();


			if (processPercent && n < 1.0) return n * svg.ViewPort.ComputeSize(viewPort);

			return n;
		};

		// time extensions
		// get the time as milliseconds
		svg.Property.prototype.toMilliseconds = function () {
			if (!this.hasValue()) return 0;

			const s = this.value+'';


			if (s.match(/s$/)) return this.numValue() * 1000;

			if (s.match(/ms$/)) return this.numValue();

			return this.numValue();
		};

		// angle extensions
		// get the angle as radians
		svg.Property.prototype.toRadians = function () {
			if (!this.hasValue()) return 0;

			const s = this.value+'';


			if (s.match(/deg$/)) return this.numValue() * (Math.PI / 180.0);

			if (s.match(/grad$/)) return this.numValue() * (Math.PI / 200.0);

			if (s.match(/rad$/)) return this.numValue();

			return this.numValue() * (Math.PI / 180.0);
		};

		// text extensions
		// get the text baseline
		const textBaselineMapping = {
			'baseline': 'alphabetic',
			'before-edge': 'top',
			'text-before-edge': 'top',
			'middle': 'middle',
			'central': 'middle',
			'after-edge': 'bottom',
			'text-after-edge': 'bottom',
			'ideographic': 'ideographic',
			'alphabetic': 'alphabetic',
			'hanging': 'hanging',
			'mathematical': 'alphabetic',
		};

		svg.Property.prototype.toTextBaseline = function () {
			if (!this.hasValue()) return null;

			return textBaselineMapping[this.value];
		};

		// fonts
		svg.Font = new (function () {
			this.Styles = 'normal|italic|oblique|inherit';
			this.Variants = 'normal|small-caps|inherit';
			this.Weights = 'normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900|inherit';

			this.CreateFont = function (fontStyle, fontVariant, fontWeight, fontSize, fontFamily, inherit) {
				const f = inherit != null ? this.Parse(inherit) : this.CreateFont('', '', '', '', '', svg.ctx.font);

				return {
					fontFamily: fontFamily || f.fontFamily,
					fontSize: fontSize || f.fontSize,
					fontStyle: fontStyle || f.fontStyle,
					fontWeight: fontWeight || f.fontWeight,
					fontVariant: fontVariant || f.fontVariant,
					toString: function () {
						return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontSize, this.fontFamily].join(' ');
					},
				};
			};

			const that = this;

			this.Parse = function (s) {
				const f = {};
				const d = svg.trim(svg.compressSpaces(s || '')).split(' ');
				const set = { fontSize: false, fontStyle: false, fontWeight: false, fontVariant: false };
				let ff = '';

				for (let i=0; i<d.length; i++) {
					if (!set.fontStyle && that.Styles.indexOf(d[i]) != -1) {
						if (d[i] != 'inherit') f.fontStyle = d[i];

						set.fontStyle = true;
					} else if (!set.fontVariant && that.Variants.indexOf(d[i]) != -1) {
						if (d[i] != 'inherit') f.fontVariant = d[i];

						set.fontStyle = set.fontVariant = true;
					} else if (!set.fontWeight && that.Weights.indexOf(d[i]) != -1) {
						if (d[i] != 'inherit') f.fontWeight = d[i];

						set.fontStyle = set.fontVariant = set.fontWeight = true;
					} else if (!set.fontSize) {
						if (d[i] != 'inherit') f.fontSize = d[i].split('/')[0];

						set.fontStyle = set.fontVariant = set.fontWeight = set.fontSize = true;
					} else {
						if (d[i] != 'inherit') ff += d[i];
					}
				}

				if (ff != '') f.fontFamily = ff;

				return f;
			};
		});

		// points and paths
		svg.ToNumberArray = function (s) {
			const a = svg.trim(svg.compressSpaces((s || '').replace(/,/g, ' '))).split(' ');

			for (let i=0; i<a.length; i++) {
				a[i] = parseFloat(a[i]);
			}
			return a;
		};
		svg.Point = function (x, y) {
			this.x = x;
			this.y = y;
		};
		svg.Point.prototype.angleTo = function (p) {
			return Math.atan2(p.y - this.y, p.x - this.x);
		};

		svg.Point.prototype.applyTransform = function (v) {
			const xp = this.x * v[0] + this.y * v[2] + v[4];
			const yp = this.x * v[1] + this.y * v[3] + v[5];

			this.x = xp;
			this.y = yp;
		};

		svg.CreatePoint = function (s) {
			const a = svg.ToNumberArray(s);

			return new svg.Point(a[0], a[1]);
		};
		svg.CreatePath = function (s) {
			const a = svg.ToNumberArray(s);
			const path = [];

			for (let i=0; i<a.length; i+=2) {
				path.push(new svg.Point(a[i], a[i+1]));
			}
			return path;
		};

		// bounding box
		svg.BoundingBox = function (x1, y1, x2, y2) { // pass in initial points if you want
			this.x1 = Number.NaN;
			this.y1 = Number.NaN;
			this.x2 = Number.NaN;
			this.y2 = Number.NaN;

			this.x = function () {
				return this.x1;
			};
			this.y = function () {
				return this.y1;
			};
			this.width = function () {
				return this.x2 - this.x1;
			};
			this.height = function () {
				return this.y2 - this.y1;
			};

			this.addPoint = function (x, y) {
				if (x != null) {
					if (isNaN(this.x1) || isNaN(this.x2)) {
						this.x1 = x;
						this.x2 = x;
					}

					if (x < this.x1) this.x1 = x;

					if (x > this.x2) this.x2 = x;
				}

				if (y != null) {
					if (isNaN(this.y1) || isNaN(this.y2)) {
						this.y1 = y;
						this.y2 = y;
					}

					if (y < this.y1) this.y1 = y;

					if (y > this.y2) this.y2 = y;
				}
			};
			this.addX = function (x) {
				this.addPoint(x, null);
			};
			this.addY = function (y) {
				this.addPoint(null, y);
			};

			this.addBoundingBox = function (bb) {
				this.addPoint(bb.x1, bb.y1);
				this.addPoint(bb.x2, bb.y2);
			};

			this.addQuadraticCurve = function (p0x, p0y, p1x, p1y, p2x, p2y) {
				const cp1x = p0x + 2/3 * (p1x - p0x); // CP1 = QP0 + 2/3 *(QP1-QP0)
				const cp1y = p0y + 2/3 * (p1y - p0y); // CP1 = QP0 + 2/3 *(QP1-QP0)
				const cp2x = cp1x + 1/3 * (p2x - p0x); // CP2 = CP1 + 1/3 *(QP2-QP0)
				const cp2y = cp1y + 1/3 * (p2y - p0y); // CP2 = CP1 + 1/3 *(QP2-QP0)

				this.addBezierCurve(p0x, p0y, cp1x, cp2x, cp1y, cp2y, p2x, p2y);
			};

			this.addBezierCurve = function (p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
				// from http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
				const p0 = [p0x, p0y]; const p1 = [p1x, p1y]; const p2 = [p2x, p2y]; const p3 = [p3x, p3y];

				this.addPoint(p0[0], p0[1]);
				this.addPoint(p3[0], p3[1]);

				for (i=0; i<=1; i++) {
					const f = function (t) {
						return Math.pow(1-t, 3) * p0[i]
            + 3 * Math.pow(1-t, 2) * t * p1[i]
            + 3 * (1-t) * Math.pow(t, 2) * p2[i]
            + Math.pow(t, 3) * p3[i];
					};

					const b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
					const a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
					const c = 3 * p1[i] - 3 * p0[i];

					if (a == 0) {
						if (b == 0) continue;

						const t = -c / b;


						if (0 < t && t < 1) {
							if (i == 0) this.addX(f(t));

							if (i == 1) this.addY(f(t));
						}

						continue;
					}

					const b2ac = Math.pow(b, 2) - 4 * c * a;


					if (b2ac < 0) continue;

					const t1 = (-b + Math.sqrt(b2ac)) / (2 * a);


					if (0 < t1 && t1 < 1) {
						if (i == 0) this.addX(f(t1));

						if (i == 1) this.addY(f(t1));
					}

					const t2 = (-b - Math.sqrt(b2ac)) / (2 * a);


					if (0 < t2 && t2 < 1) {
						if (i == 0) this.addX(f(t2));

						if (i == 1) this.addY(f(t2));
					}
				}
			};

			this.isPointInBox = function (x, y) {
				return (this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2);
			};

			this.addPoint(x1, y1);
			this.addPoint(x2, y2);
		};

		// transforms
		svg.Transform = function (v) {
			const that = this;

			this.Type = {};

			// translate
			this.Type.translate = function (s) {
				this.p = svg.CreatePoint(s);
				this.apply = function (ctx) {
					ctx.translate(this.p.x || 0.0, this.p.y || 0.0);
				};
				this.unapply = function (ctx) {
					ctx.translate(-1.0 * this.p.x || 0.0, -1.0 * this.p.y || 0.0);
				};
				this.applyToPoint = function (p) {
					p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
				};
			};

			// rotate
			this.Type.rotate = function (s) {
				const a = svg.ToNumberArray(s);

				this.angle = new svg.Property('angle', a[0]);
				this.cx = a[1] || 0;
				this.cy = a[2] || 0;
				this.apply = function (ctx) {
					ctx.translate(this.cx, this.cy);
					ctx.rotate(this.angle.toRadians());
					ctx.translate(-this.cx, -this.cy);
				};
				this.unapply = function (ctx) {
					ctx.translate(this.cx, this.cy);
					ctx.rotate(-1.0 * this.angle.toRadians());
					ctx.translate(-this.cx, -this.cy);
				};
				this.applyToPoint = function (p) {
					const a = this.angle.toRadians();

					p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
					p.applyTransform([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]);
					p.applyTransform([1, 0, 0, 1, -this.p.x || 0.0, -this.p.y || 0.0]);
				};
			};

			this.Type.scale = function (s) {
				this.p = svg.CreatePoint(s);
				this.apply = function (ctx) {
					ctx.scale(this.p.x || 1.0, this.p.y || this.p.x || 1.0);
				};
				this.unapply = function (ctx) {
					ctx.scale(1.0 / this.p.x || 1.0, 1.0 / this.p.y || this.p.x || 1.0);
				};
				this.applyToPoint = function (p) {
					p.applyTransform([this.p.x || 0.0, 0, 0, this.p.y || 0.0, 0, 0]);
				};
			};

			this.Type.matrix = function (s) {
				this.m = svg.ToNumberArray(s);
				this.apply = function (ctx) {
					ctx.transform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
				};
				this.unapply = function (ctx) {
					const a = this.m[0];
					const b = this.m[2];
					const c = this.m[4];
					const d = this.m[1];
					const e = this.m[3];
					const f = this.m[5];
					const g = 0.0;
					const h = 0.0;
					const i = 1.0;
					const det = 1 / (a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g));

					ctx.transform(
						det*(e*i-f*h),
						det*(f*g-d*i),
						det*(c*h-b*i),
						det*(a*i-c*g),
						det*(b*f-c*e),
						det*(c*d-a*f)
					);
				};
				this.applyToPoint = function (p) {
					p.applyTransform(this.m);
				};
			};

			this.Type.SkewBase = function (s) {
				this.base = that.Type.matrix;
				this.base(s);
				this.angle = new svg.Property('angle', s);
			};
			this.Type.SkewBase.prototype = new this.Type.matrix;

			this.Type.skewX = function (s) {
				this.base = that.Type.SkewBase;
				this.base(s);
				this.m = [1, 0, Math.tan(this.angle.toRadians()), 1, 0, 0];
			};
			this.Type.skewX.prototype = new this.Type.SkewBase;

			this.Type.skewY = function (s) {
				this.base = that.Type.SkewBase;
				this.base(s);
				this.m = [1, Math.tan(this.angle.toRadians()), 0, 1, 0, 0];
			};
			this.Type.skewY.prototype = new this.Type.SkewBase;

			this.transforms = [];

			this.apply = function (ctx) {
				for (let i=0; i<this.transforms.length; i++) {
					this.transforms[i].apply(ctx);
				}
			};

			this.unapply = function (ctx) {
				for (let i=this.transforms.length-1; i>=0; i--) {
					this.transforms[i].unapply(ctx);
				}
			};

			this.applyToPoint = function (p) {
				for (let i=0; i<this.transforms.length; i++) {
					this.transforms[i].applyToPoint(p);
				}
			};

			const data = svg.trim(svg.compressSpaces(v)).replace(/\)([a-zA-Z])/g, ') $1').replace(/\)(\s?,\s?)/g,') ').split(/\s(?=[a-z])/);

			for (let i=0; i<data.length; i++) {
				const type = svg.trim(data[i].split('(')[0]);
				const s = data[i].split('(')[1].replace(')','');
				const transformType = this.Type[type];


				if (typeof transformType !== 'undefined') {
					const transform = new transformType(s);

					transform.type = type;
					this.transforms.push(transform);
				}
			}
		};

		// aspect ratio
		svg.AspectRatio = function (ctx, aspectRatio, width, desiredWidth, height, desiredHeight, minX, minY, refX, refY) {
			// aspect ratio - http://www.w3.org/TR/SVG/coords.html#PreserveAspectRatioAttribute
			aspectRatio = svg.compressSpaces(aspectRatio);
			aspectRatio = aspectRatio.replace(/^defer\s/,''); // ignore defer
			const align = aspectRatio.split(' ')[0] || 'xMidYMid';
			const meetOrSlice = aspectRatio.split(' ')[1] || 'meet';

			// calculate scale
			const scaleX = width / desiredWidth;
			const scaleY = height / desiredHeight;
			const scaleMin = Math.min(scaleX, scaleY);
			const scaleMax = Math.max(scaleX, scaleY);


			if (meetOrSlice == 'meet') {
				desiredWidth *= scaleMin; desiredHeight *= scaleMin;
			}

			if (meetOrSlice == 'slice') {
				desiredWidth *= scaleMax; desiredHeight *= scaleMax;
			}

			refX = new svg.Property('refX', refX);
			refY = new svg.Property('refY', refY);

			if (refX.hasValue() && refY.hasValue()) {
				ctx.translate(-scaleMin * refX.toPixels('x'), -scaleMin * refY.toPixels('y'));
			} else {
				// align
				if (align.match(/^xMid/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width / 2.0 - desiredWidth / 2.0, 0);

				if (align.match(/YMid$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height / 2.0 - desiredHeight / 2.0);

				if (align.match(/^xMax/) && ((meetOrSlice == 'meet' && scaleMin == scaleY) || (meetOrSlice == 'slice' && scaleMax == scaleY))) ctx.translate(width - desiredWidth, 0);

				if (align.match(/YMax$/) && ((meetOrSlice == 'meet' && scaleMin == scaleX) || (meetOrSlice == 'slice' && scaleMax == scaleX))) ctx.translate(0, height - desiredHeight);
			}

			// scale
			if (align == 'none') ctx.scale(scaleX, scaleY);
			else if (meetOrSlice == 'meet') ctx.scale(scaleMin, scaleMin);
			else if (meetOrSlice == 'slice') ctx.scale(scaleMax, scaleMax);

			// translate
			ctx.translate(minX == null ? 0 : -minX, minY == null ? 0 : -minY);
		};

		// elements
		svg.Element = {};

		svg.EmptyProperty = new svg.Property('EMPTY', '');

		svg.Element.ElementBase = function (node) {
			this.attributes = {};
			this.styles = {};
			this.stylesSpecificity = {};
			this.children = [];

			// get or create attribute
			this.attribute = function (name, createIfNotExists) {
				let a = this.attributes[name];


				if (a != null) return a;

				if (createIfNotExists == true) {
					a = new svg.Property(name, ''); this.attributes[name] = a;
				}

				return a || svg.EmptyProperty;
			};

			this.getHrefAttribute = function () {
				for (const a in this.attributes) {
					if (a == 'href' || a.match(/:href$/)) {
						return this.attributes[a];
					}
				}
				return svg.EmptyProperty;
			};

			// get or create style, crawls up node tree
			this.style = function (name, createIfNotExists, skipAncestors) {
				let s = this.styles[name];


				if (s != null) return s;

				const a = this.attribute(name);


				if (a != null && a.hasValue()) {
					this.styles[name] = a; // move up to me to cache
					return a;
				}

				if (skipAncestors != true) {
					const p = this.parent;


					if (p != null) {
						const ps = p.style(name);


						if (ps != null && ps.hasValue()) {
							return ps;
						}
					}
				}

				if (createIfNotExists == true) {
					s = new svg.Property(name, ''); this.styles[name] = s;
				}

				return s || svg.EmptyProperty;
			};

			// base render
			this.render = function (ctx) {
				// don't render display=none
				if (this.style('display').value == 'none') return;

				// don't render visibility=hidden
				if (this.style('visibility').value == 'hidden') return;

				ctx.save();

				if (this.style('mask').hasValue()) { // mask
					const mask = this.style('mask').getDefinition();


					if (mask != null) mask.apply(ctx, this);
				} else if (this.style('filter').hasValue()) { // filter
					const filter = this.style('filter').getDefinition();


					if (filter != null) filter.apply(ctx, this);
				} else {
					this.setContext(ctx);
					this.renderChildren(ctx);
					this.clearContext(ctx);
				}

				ctx.restore();
			};

			// base set context
			this.setContext = function (ctx) {
				// OVERRIDE ME!
			};

			// base clear context
			this.clearContext = function (ctx) {
				// OVERRIDE ME!
			};

			// base render children
			this.renderChildren = function (ctx) {
				for (let i=0; i<this.children.length; i++) {
					this.children[i].render(ctx);
				}
			};

			this.addChild = function (childNode, create) {
				let child = childNode;


				if (create) child = svg.CreateElement(childNode);

				child.parent = this;

				if (child.type != 'title') {
					this.children.push(child);
				}
			};

			this.addStylesFromStyleDefinition = function () {
				// add styles
				for (const selector in svg.Styles) {
					if (selector[0] != '@' && matchesSelector(node, selector)) {
						const styles = svg.Styles[selector];
						const specificity = svg.StylesSpecificity[selector];


						if (styles != null) {
							for (const name in styles) {
								let existingSpecificity = this.stylesSpecificity[name];


								if (typeof existingSpecificity === 'undefined') {
									existingSpecificity = '000';
								}

								if (specificity > existingSpecificity) {
									this.styles[name] = styles[name];
									this.stylesSpecificity[name] = specificity;
								}
							}
						}
					}
				}
			};

			// Microsoft Edge fix
			const allUppercase = new RegExp("^[A-Z\-]+$");
			const normalizeAttributeName = function (name) {
				if (allUppercase.test(name)) {
					return name.toLowerCase();
				}

				return name;
			};

			if (node != null && node.nodeType == 1) { //ELEMENT_NODE
				// add attributes
				for (var i=0; i<node.attributes.length; i++) {
					const attribute = node.attributes[i];
					const nodeName = normalizeAttributeName(attribute.nodeName);

					this.attributes[nodeName] = new svg.Property(nodeName, attribute.value);
				}

				this.addStylesFromStyleDefinition();

				// add inline styles
				if (this.attribute('style').hasValue()) {
					const styles = this.attribute('style').value.split(';');

					for (var i=0; i<styles.length; i++) {
						if (svg.trim(styles[i]) != '') {
							const style = styles[i].split(':');
							const name = svg.trim(style[0]);
							const value = svg.trim(style[1]);

							this.styles[name] = new svg.Property(name, value);
						}
					}
				}

				// add id
				if (this.attribute('id').hasValue()) {
					if (svg.Definitions[this.attribute('id').value] == null) {
						svg.Definitions[this.attribute('id').value] = this;
					}
				}

				// add children
				for (var i=0; i<node.childNodes.length; i++) {
					const childNode = node.childNodes[i];


					if (childNode.nodeType == 1) this.addChild(childNode, true); //ELEMENT_NODE

					if (this.captureTextNodes && (childNode.nodeType == 3 || childNode.nodeType == 4)) {
						const text = childNode.value || childNode.text || childNode.textContent || '';


						if (svg.compressSpaces(text) != '') {
							this.addChild(new svg.Element.tspan(childNode), false); // TEXT_NODE
						}
					}
				}
			}
		};

		svg.Element.RenderedElementBase = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.setContext = function (ctx) {
				// fill
				if (this.style('fill').isUrlDefinition()) {
					var fs = this.style('fill').getFillStyleDefinition(this, this.style('fill-opacity'));


					if (fs != null) ctx.fillStyle = fs;
				} else if (this.style('fill').hasValue()) {
					var fillStyle = this.style('fill');


					if (fillStyle.value == 'currentColor') fillStyle.value = this.style('color').value;

					if (fillStyle.value != 'inherit') ctx.fillStyle = (fillStyle.value == 'none' ? 'rgba(0,0,0,0)' : fillStyle.value);
				}

				if (this.style('fill-opacity').hasValue()) {
					var fillStyle = new svg.Property('fill', ctx.fillStyle);

					fillStyle = fillStyle.addOpacity(this.style('fill-opacity'));
					ctx.fillStyle = fillStyle.value;
				}

				// stroke
				if (this.style('stroke').isUrlDefinition()) {
					var fs = this.style('stroke').getFillStyleDefinition(this, this.style('stroke-opacity'));


					if (fs != null) ctx.strokeStyle = fs;
				} else if (this.style('stroke').hasValue()) {
					var strokeStyle = this.style('stroke');


					if (strokeStyle.value == 'currentColor') strokeStyle.value = this.style('color').value;

					if (strokeStyle.value != 'inherit') ctx.strokeStyle = (strokeStyle.value == 'none' ? 'rgba(0,0,0,0)' : strokeStyle.value);
				}

				if (this.style('stroke-opacity').hasValue()) {
					var strokeStyle = new svg.Property('stroke', ctx.strokeStyle);

					strokeStyle = strokeStyle.addOpacity(this.style('stroke-opacity'));
					ctx.strokeStyle = strokeStyle.value;
				}

				if (this.style('stroke-width').hasValue()) {
					const newLineWidth = this.style('stroke-width').toPixels();

					ctx.lineWidth = newLineWidth == 0 ? 0.001 : newLineWidth; // browsers don't respect 0
				}

				if (this.style('stroke-linecap').hasValue()) ctx.lineCap = this.style('stroke-linecap').value;

				if (this.style('stroke-linejoin').hasValue()) ctx.lineJoin = this.style('stroke-linejoin').value;

				if (this.style('stroke-miterlimit').hasValue()) ctx.miterLimit = this.style('stroke-miterlimit').value;

				if (this.style('stroke-dasharray').hasValue() && this.style('stroke-dasharray').value != 'none') {
					const gaps = svg.ToNumberArray(this.style('stroke-dasharray').value);


					if (typeof ctx.setLineDash !== 'undefined') {
						ctx.setLineDash(gaps);
					} else if (typeof ctx.webkitLineDash !== 'undefined') {
						ctx.webkitLineDash = gaps;
					} else if (typeof ctx.mozDash !== 'undefined' && !(gaps.length==1 && gaps[0]==0)) {
						ctx.mozDash = gaps;
					}

					const offset = this.style('stroke-dashoffset').numValueOrDefault(1);


					if (typeof ctx.lineDashOffset !== 'undefined') {
						ctx.lineDashOffset = offset;
					} else if (typeof ctx.webkitLineDashOffset !== 'undefined') {
						ctx.webkitLineDashOffset = offset;
					} else if (typeof ctx.mozDashOffset !== 'undefined') {
						ctx.mozDashOffset = offset;
					}
				}

				// font
				if (typeof ctx.font !== 'undefined') {
					ctx.font = svg.Font.CreateFont(
						this.style('font-style').value,
						this.style('font-variant').value,
						this.style('font-weight').value,
						this.style('font-size').hasValue() ? this.style('font-size').toPixels() + 'px' : '',
						this.style('font-family').value).toString();
				}

				// transform
				if (this.style('transform', false, true).hasValue()) {
					const transform = new svg.Transform(this.style('transform', false, true).value);

					transform.apply(ctx);
				}

				// clip
				if (this.style('clip-path', false, true).hasValue()) {
					const clip = this.style('clip-path', false, true).getDefinition();


					if (clip != null) clip.apply(ctx);
				}

				// opacity
				if (this.style('opacity').hasValue()) {
					ctx.globalAlpha = this.style('opacity').numValue();
				}
			};
		};
		svg.Element.RenderedElementBase.prototype = new svg.Element.ElementBase;

		svg.Element.PathElementBase = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.path = function (ctx) {
				if (ctx != null) ctx.beginPath();

				return new svg.BoundingBox();
			};

			this.renderChildren = function (ctx) {
				this.path(ctx);
				svg.Mouse.checkPath(this, ctx);

				if (ctx.fillStyle != '') {
					if (this.style('fill-rule').valueOrDefault('inherit') != 'inherit') {
						ctx.fill(this.style('fill-rule').value);
					} else {
						ctx.fill();
					}
				}

				if (ctx.strokeStyle != '') ctx.stroke();

				const markers = this.getMarkers();


				if (markers != null) {
					if (this.style('marker-start').isUrlDefinition()) {
						var marker = this.style('marker-start').getDefinition();

						marker.render(ctx, markers[0][0], markers[0][1]);
					}

					if (this.style('marker-mid').isUrlDefinition()) {
						var marker = this.style('marker-mid').getDefinition();

						for (let i=1;i<markers.length-1;i++) {
							marker.render(ctx, markers[i][0], markers[i][1]);
						}
					}

					if (this.style('marker-end').isUrlDefinition()) {
						var marker = this.style('marker-end').getDefinition();

						marker.render(ctx, markers[markers.length-1][0], markers[markers.length-1][1]);
					}
				}
			};

			this.getBoundingBox = function () {
				return this.path();
			};

			this.getMarkers = function () {
				return null;
			};
		};
		svg.Element.PathElementBase.prototype = new svg.Element.RenderedElementBase;

		// svg element
		svg.Element.svg = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.baseClearContext = this.clearContext;
			this.clearContext = function (ctx) {
				this.baseClearContext(ctx);
				svg.ViewPort.RemoveCurrent();
			};

			this.baseSetContext = this.setContext;
			this.setContext = function (ctx) {
				// initial values and defaults
				ctx.strokeStyle = 'rgba(0,0,0,0)';
				ctx.lineCap = 'butt';
				ctx.lineJoin = 'miter';
				ctx.miterLimit = 4;

				if (typeof ctx.font !== 'undefined' && typeof window.getComputedStyle !== 'undefined') {
					ctx.font = window.getComputedStyle(ctx.canvas).getPropertyValue('font');
				}

				this.baseSetContext(ctx);

				// create new view port
				if (!this.attribute('x').hasValue()) this.attribute('x', true).value = 0;

				if (!this.attribute('y').hasValue()) this.attribute('y', true).value = 0;

				ctx.translate(this.attribute('x').toPixels('x'), this.attribute('y').toPixels('y'));

				let width = svg.ViewPort.width();
				let height = svg.ViewPort.height();

				if (!this.attribute('width').hasValue()) this.attribute('width', true).value = '100%';

				if (!this.attribute('height').hasValue()) this.attribute('height', true).value = '100%';

				if (typeof this.root === 'undefined') {
					width = this.attribute('width').toPixels('x');
					height = this.attribute('height').toPixels('y');

					let x = 0;
					let y = 0;


					if (this.attribute('refX').hasValue() && this.attribute('refY').hasValue()) {
						x = -this.attribute('refX').toPixels('x');
						y = -this.attribute('refY').toPixels('y');
					}

					if (this.attribute('overflow').valueOrDefault('hidden') != 'visible') {
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(width, y);
						ctx.lineTo(width, height);
						ctx.lineTo(x, height);
						ctx.closePath();
						ctx.clip();
					}
				}

				svg.ViewPort.SetCurrent(width, height);

				// viewbox
				if (this.attribute('viewBox').hasValue()) {
					const viewBox = svg.ToNumberArray(this.attribute('viewBox').value);
					const minX = viewBox[0];
					const minY = viewBox[1];

					width = viewBox[2];
					height = viewBox[3];

					svg.AspectRatio(ctx,
						this.attribute('preserveAspectRatio').value,
						svg.ViewPort.width(),
						width,
						svg.ViewPort.height(),
						height,
						minX,
						minY,
						this.attribute('refX').value,
						this.attribute('refY').value);

					svg.ViewPort.RemoveCurrent();
					svg.ViewPort.SetCurrent(viewBox[2], viewBox[3]);
				}
			};
		};
		svg.Element.svg.prototype = new svg.Element.RenderedElementBase;

		// rect element
		svg.Element.rect = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			this.path = function (ctx) {
				const x = this.attribute('x').toPixels('x');
				const y = this.attribute('y').toPixels('y');
				const width = this.attribute('width').toPixels('x');
				const height = this.attribute('height').toPixels('y');
				let rx = this.attribute('rx').toPixels('x');
				let ry = this.attribute('ry').toPixels('y');


				if (this.attribute('rx').hasValue() && !this.attribute('ry').hasValue()) ry = rx;

				if (this.attribute('ry').hasValue() && !this.attribute('rx').hasValue()) rx = ry;

				rx = Math.min(rx, width / 2.0);
				ry = Math.min(ry, height / 2.0);

				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(x + rx, y);
					ctx.lineTo(x + width - rx, y);
					ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
					ctx.lineTo(x + width, y + height - ry);
					ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
					ctx.lineTo(x + rx, y + height);
					ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
					ctx.lineTo(x, y + ry);
					ctx.quadraticCurveTo(x, y, x + rx, y);
					ctx.closePath();
				}

				return new svg.BoundingBox(x, y, x + width, y + height);
			};
		};
		svg.Element.rect.prototype = new svg.Element.PathElementBase;

		// circle element
		svg.Element.circle = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			this.path = function (ctx) {
				const cx = this.attribute('cx').toPixels('x');
				const cy = this.attribute('cy').toPixels('y');
				const r = this.attribute('r').toPixels();

				if (ctx != null) {
					ctx.beginPath();
					ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
					ctx.closePath();
				}

				return new svg.BoundingBox(cx - r, cy - r, cx + r, cy + r);
			};
		};
		svg.Element.circle.prototype = new svg.Element.PathElementBase;

		// ellipse element
		svg.Element.ellipse = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			this.path = function (ctx) {
				const KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
				const rx = this.attribute('rx').toPixels('x');
				const ry = this.attribute('ry').toPixels('y');
				const cx = this.attribute('cx').toPixels('x');
				const cy = this.attribute('cy').toPixels('y');

				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(cx, cy - ry);
					ctx.bezierCurveTo(cx + (KAPPA * rx), cy - ry,  cx + rx, cy - (KAPPA * ry), cx + rx, cy);
					ctx.bezierCurveTo(cx + rx, cy + (KAPPA * ry), cx + (KAPPA * rx), cy + ry, cx, cy + ry);
					ctx.bezierCurveTo(cx - (KAPPA * rx), cy + ry, cx - rx, cy + (KAPPA * ry), cx - rx, cy);
					ctx.bezierCurveTo(cx - rx, cy - (KAPPA * ry), cx - (KAPPA * rx), cy - ry, cx, cy - ry);
					ctx.closePath();
				}

				return new svg.BoundingBox(cx - rx, cy - ry, cx + rx, cy + ry);
			};
		};
		svg.Element.ellipse.prototype = new svg.Element.PathElementBase;

		// line element
		svg.Element.line = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			this.getPoints = function () {
				return [
					new svg.Point(this.attribute('x1').toPixels('x'), this.attribute('y1').toPixels('y')),
					new svg.Point(this.attribute('x2').toPixels('x'), this.attribute('y2').toPixels('y'))];
			};

			this.path = function (ctx) {
				const points = this.getPoints();

				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(points[0].x, points[0].y);
					ctx.lineTo(points[1].x, points[1].y);
				}

				return new svg.BoundingBox(points[0].x, points[0].y, points[1].x, points[1].y);
			};

			this.getMarkers = function () {
				const points = this.getPoints();
				const a = points[0].angleTo(points[1]);

				return [[points[0], a], [points[1], a]];
			};
		};
		svg.Element.line.prototype = new svg.Element.PathElementBase;

		// polyline element
		svg.Element.polyline = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			this.points = svg.CreatePath(this.attribute('points').value);
			this.path = function (ctx) {
				const bb = new svg.BoundingBox(this.points[0].x, this.points[0].y);


				if (ctx != null) {
					ctx.beginPath();
					ctx.moveTo(this.points[0].x, this.points[0].y);
				}

				for (let i=1; i<this.points.length; i++) {
					bb.addPoint(this.points[i].x, this.points[i].y);

					if (ctx != null) ctx.lineTo(this.points[i].x, this.points[i].y);
				}
				return bb;
			};

			this.getMarkers = function () {
				const markers = [];

				for (let i=0; i<this.points.length - 1; i++) {
					markers.push([this.points[i], this.points[i].angleTo(this.points[i+1])]);
				}

				if (markers.length > 0) {
					markers.push([this.points[this.points.length-1], markers[markers.length-1][1]]);
				}

				return markers;
			};
		};
		svg.Element.polyline.prototype = new svg.Element.PathElementBase;

		// polygon element
		svg.Element.polygon = function (node) {
			this.base = svg.Element.polyline;
			this.base(node);

			this.basePath = this.path;
			this.path = function (ctx) {
				const bb = this.basePath(ctx);


				if (ctx != null) {
					ctx.lineTo(this.points[0].x, this.points[0].y);
					ctx.closePath();
				}

				return bb;
			};
		};
		svg.Element.polygon.prototype = new svg.Element.polyline;

		// path element
		svg.Element.path = function (node) {
			this.base = svg.Element.PathElementBase;
			this.base(node);

			let d = this.attribute('d').value;

			d = d.replace(/,/gm,' '); // get rid of all commas
			// As the end of a match can also be the start of the next match, we need to run this replace twice.
			for (var i=0; i<2; i++)
				d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm,'$1 $2'); // suffix commands with spaces
			d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm,'$1 $2'); // prefix commands with spaces
			d = d.replace(/([0-9])([+\-])/gm,'$1 $2'); // separate digits on +- signs
			// Again, we need to run this twice to find all occurances
			for (var i=0; i<2; i++)
				d = d.replace(/(\.[0-9]*)(\.)/gm,'$1 $2'); // separate digits when they start with a comma
			d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm,'$1 $3 $4 '); // shorthand elliptical arc path syntax
			d = svg.compressSpaces(d); // compress multiple spaces
			d = svg.trim(d);
			this.PathParser = new (function (d) {
				this.tokens = d.split(' ');

				this.reset = function () {
					this.i = -1;
					this.command = '';
					this.previousCommand = '';
					this.start = new svg.Point(0, 0);
					this.control = new svg.Point(0, 0);
					this.current = new svg.Point(0, 0);
					this.points = [];
					this.angles = [];
				};

				this.isEnd = function () {
					return this.i >= this.tokens.length - 1;
				};

				this.isCommandOrEnd = function () {
					if (this.isEnd()) return true;

					return this.tokens[this.i + 1].match(/^[A-Za-z]$/) != null;
				};

				this.isRelativeCommand = function () {
					switch (this.command) {
						case 'm':
						case 'l':
						case 'h':
						case 'v':
						case 'c':
						case 's':
						case 'q':
						case 't':
						case 'a':
						case 'z':
							return true;
							break;
					}
					return false;
				};

				this.getToken = function () {
					this.i++;
					return this.tokens[this.i];
				};

				this.getScalar = function () {
					return parseFloat(this.getToken());
				};

				this.nextCommand = function () {
					this.previousCommand = this.command;
					this.command = this.getToken();
				};

				this.getPoint = function () {
					const p = new svg.Point(this.getScalar(), this.getScalar());

					return this.makeAbsolute(p);
				};

				this.getAsControlPoint = function () {
					const p = this.getPoint();

					this.control = p;
					return p;
				};

				this.getAsCurrentPoint = function () {
					const p = this.getPoint();

					this.current = p;
					return p;
				};

				this.getReflectedControlPoint = function () {
					if (this.previousCommand.toLowerCase() != 'c'
              && this.previousCommand.toLowerCase() != 's'
            && this.previousCommand.toLowerCase() != 'q'
            && this.previousCommand.toLowerCase() != 't') {
						return this.current;
					}

					// reflect point
					const p = new svg.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);

					return p;
				};

				this.makeAbsolute = function (p) {
					if (this.isRelativeCommand()) {
						p.x += this.current.x;
						p.y += this.current.y;
					}

					return p;
				};

				this.addMarker = function (p, from, priorTo) {
					// if the last angle isn't filled in because we didn't have this point yet ...
					if (priorTo != null && this.angles.length > 0 && this.angles[this.angles.length-1] == null) {
						this.angles[this.angles.length-1] = this.points[this.points.length-1].angleTo(priorTo);
					}

					this.addMarkerAngle(p, from == null ? null : from.angleTo(p));
				};

				this.addMarkerAngle = function (p, a) {
					this.points.push(p);
					this.angles.push(a);
				};

				this.getMarkerPoints = function () {
					return this.points;
				};
				this.getMarkerAngles = function () {
					for (let i=0; i<this.angles.length; i++) {
						if (this.angles[i] == null) {
							for (let j=i+1; j<this.angles.length; j++) {
								if (this.angles[j] != null) {
									this.angles[i] = this.angles[j];
									break;
								}
							}
						}
					}
					return this.angles;
				};
			})(d);

			this.path = function (ctx) {
				const pp = this.PathParser;

				pp.reset();

				const bb = new svg.BoundingBox();


				if (ctx != null) ctx.beginPath();

				while (!pp.isEnd()) {
					pp.nextCommand();
					switch (pp.command) {
						case 'M':
						case 'm':
							var p = pp.getAsCurrentPoint();

							pp.addMarker(p);
							bb.addPoint(p.x, p.y);

							if (ctx != null) ctx.moveTo(p.x, p.y);

							pp.start = pp.current;
							while (!pp.isCommandOrEnd()) {
								var p = pp.getAsCurrentPoint();

								pp.addMarker(p, pp.start);
								bb.addPoint(p.x, p.y);

								if (ctx != null) ctx.lineTo(p.x, p.y);
							}
							break;
						case 'L':
						case 'l':
							while (!pp.isCommandOrEnd()) {
								const c = pp.current;
								var p = pp.getAsCurrentPoint();

								pp.addMarker(p, c);
								bb.addPoint(p.x, p.y);

								if (ctx != null) ctx.lineTo(p.x, p.y);
							}
							break;
						case 'H':
						case 'h':
							while (!pp.isCommandOrEnd()) {
								var newP = new svg.Point((pp.isRelativeCommand() ? pp.current.x : 0) + pp.getScalar(), pp.current.y);

								pp.addMarker(newP, pp.current);
								pp.current = newP;
								bb.addPoint(pp.current.x, pp.current.y);

								if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
							}
							break;
						case 'V':
						case 'v':
							while (!pp.isCommandOrEnd()) {
								var newP = new svg.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + pp.getScalar());

								pp.addMarker(newP, pp.current);
								pp.current = newP;
								bb.addPoint(pp.current.x, pp.current.y);

								if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
							}
							break;
						case 'C':
						case 'c':
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var p1 = pp.getPoint();
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();

								pp.addMarker(cp, cntrl, p1);
								bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);

								if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							}
							break;
						case 'S':
						case 's':
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var p1 = pp.getReflectedControlPoint();
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();

								pp.addMarker(cp, cntrl, p1);
								bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);

								if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							}
							break;
						case 'Q':
						case 'q':
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();

								pp.addMarker(cp, cntrl, cntrl);
								bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);

								if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
							}
							break;
						case 'T':
						case 't':
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var cntrl = pp.getReflectedControlPoint();

								pp.control = cntrl;
								var cp = pp.getAsCurrentPoint();

								pp.addMarker(cp, cntrl, cntrl);
								bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);

								if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
							}
							break;
						case 'A':
						case 'a':
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								let rx = pp.getScalar();
								let ry = pp.getScalar();
								const xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
								const largeArcFlag = pp.getScalar();
								const sweepFlag = pp.getScalar();
								var cp = pp.getAsCurrentPoint();

								// Conversion from endpoint to center parameterization
								// http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
								// x1', y1'
								const currp = new svg.Point(
									Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0,
									-Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0
								);
								// adjust radii
								const l = Math.pow(currp.x,2)/Math.pow(rx,2)+Math.pow(currp.y,2)/Math.pow(ry,2);


								if (l > 1) {
									rx *= Math.sqrt(l);
									ry *= Math.sqrt(l);
								}

								// cx', cy'
								let s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
									((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currp.y,2))-(Math.pow(ry,2)*Math.pow(currp.x,2)))
                / (Math.pow(rx,2)*Math.pow(currp.y,2)+Math.pow(ry,2)*Math.pow(currp.x,2))
								);


								if (isNaN(s)) s = 0;

								const cpp = new svg.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
								// cx, cy
								const centp = new svg.Point(
									(curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
									(curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
								);
								// vector magnitude
								var m = function (v) {
									return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2));
								};
								// ratio between two vectors
								var r = function (u, v) {
									return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v));
								};
								// angle between two vectors
								const a = function (u, v) {
									return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos(r(u,v));
								};
								// initial angle
								const a1 = a([1,0], [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry]);
								// angle delta
								const u = [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry];
								const v = [(-currp.x-cpp.x)/rx,(-currp.y-cpp.y)/ry];
								let ad = a(u, v);


								if (r(u,v) <= -1) ad = Math.PI;

								if (r(u,v) >= 1) ad = 0;

								// for markers
								const dir = 1 - sweepFlag ? 1.0 : -1.0;
								const ah = a1 + dir * (ad / 2.0);
								const halfWay = new svg.Point(
									centp.x + rx * Math.cos(ah),
									centp.y + ry * Math.sin(ah)
								);

								pp.addMarkerAngle(halfWay, ah - dir * Math.PI / 2);
								pp.addMarkerAngle(cp, ah - dir * Math.PI);

								bb.addPoint(cp.x, cp.y);

								if (ctx != null) {
									var r = rx > ry ? rx : ry;
									const sx = rx > ry ? 1 : rx / ry;
									const sy = rx > ry ? ry / rx : 1;

									ctx.translate(centp.x, centp.y);
									ctx.rotate(xAxisRotation);
									ctx.scale(sx, sy);
									ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
									ctx.scale(1/sx, 1/sy);
									ctx.rotate(-xAxisRotation);
									ctx.translate(-centp.x, -centp.y);
								}
							}
							break;
						case 'Z':
						case 'z':
							if (ctx != null) ctx.closePath();

							pp.current = pp.start;
					}
				}

				return bb;
			};

			this.getMarkers = function () {
				const points = this.PathParser.getMarkerPoints();
				const angles = this.PathParser.getMarkerAngles();

				const markers = [];

				for (let i=0; i<points.length; i++) {
					markers.push([points[i], angles[i]]);
				}
				return markers;
			};
		};
		svg.Element.path.prototype = new svg.Element.PathElementBase;

		// pattern element
		svg.Element.pattern = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.createPattern = function (ctx, element) {
				const width = this.attribute('width').toPixels('x', true);
				const height = this.attribute('height').toPixels('y', true);

				// render me using a temporary svg element
				const tempSvg = new svg.Element.svg();

				tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
				tempSvg.attributes['width'] = new svg.Property('width', width + 'px');
				tempSvg.attributes['height'] = new svg.Property('height', height + 'px');
				tempSvg.attributes['transform'] = new svg.Property('transform', this.attribute('patternTransform').value);
				tempSvg.children = this.children;

				const c = document.createElement('canvas');

				c.width = width;
				c.height = height;
				const cctx = c.getContext('2d');


				if (this.attribute('x').hasValue() && this.attribute('y').hasValue()) {
					cctx.translate(this.attribute('x').toPixels('x', true), this.attribute('y').toPixels('y', true));
				}

				// render 3x3 grid so when we transform there's no white space on edges
				for (let x=-1; x<=1; x++) {
					for (let y=-1; y<=1; y++) {
						cctx.save();
						tempSvg.attributes['x'] = new svg.Property('x', x * c.width);
						tempSvg.attributes['y'] = new svg.Property('y', y * c.height);
						tempSvg.render(cctx);
						cctx.restore();
					}
				}
				const pattern = ctx.createPattern(c, 'repeat');

				return pattern;
			};
		};
		svg.Element.pattern.prototype = new svg.Element.ElementBase;

		// marker element
		svg.Element.marker = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.baseRender = this.render;
			this.render = function (ctx, point, angle) {
				ctx.translate(point.x, point.y);

				if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(angle);

				if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(ctx.lineWidth, ctx.lineWidth);

				ctx.save();

				// render me using a temporary svg element
				const tempSvg = new svg.Element.svg();

				tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
				tempSvg.attributes['refX'] = new svg.Property('refX', this.attribute('refX').value);
				tempSvg.attributes['refY'] = new svg.Property('refY', this.attribute('refY').value);
				tempSvg.attributes['width'] = new svg.Property('width', this.attribute('markerWidth').value);
				tempSvg.attributes['height'] = new svg.Property('height', this.attribute('markerHeight').value);
				tempSvg.attributes['fill'] = new svg.Property('fill', this.attribute('fill').valueOrDefault('black'));
				tempSvg.attributes['stroke'] = new svg.Property('stroke', this.attribute('stroke').valueOrDefault('none'));
				tempSvg.children = this.children;
				tempSvg.render(ctx);

				ctx.restore();

				if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(1/ctx.lineWidth, 1/ctx.lineWidth);

				if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(-angle);

				ctx.translate(-point.x, -point.y);
			};
		};
		svg.Element.marker.prototype = new svg.Element.ElementBase;

		// definitions element
		svg.Element.defs = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.render = function (ctx) {
				// NOOP
			};
		};
		svg.Element.defs.prototype = new svg.Element.ElementBase;

		// base for gradients
		svg.Element.GradientBase = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.stops = [];
			for (let i=0; i<this.children.length; i++) {
				const child = this.children[i];


				if (child.type == 'stop') this.stops.push(child);
			}

			this.getGradient = function () {
				// OVERRIDE ME!
			};

			this.gradientUnits = function () {
				return this.attribute('gradientUnits').valueOrDefault('objectBoundingBox');
			};

			this.attributesToInherit = ['gradientUnits'];

			this.inheritStopContainer = function (stopsContainer) {
				for (let i=0; i<this.attributesToInherit.length; i++) {
					const attributeToInherit = this.attributesToInherit[i];


					if (!this.attribute(attributeToInherit).hasValue() && stopsContainer.attribute(attributeToInherit).hasValue()) {
						this.attribute(attributeToInherit, true).value = stopsContainer.attribute(attributeToInherit).value;
					}
				}
			};

			this.createGradient = function (ctx, element, parentOpacityProp) {
				let stopsContainer = this;


				if (this.getHrefAttribute().hasValue()) {
					stopsContainer = this.getHrefAttribute().getDefinition();
					this.inheritStopContainer(stopsContainer);
				}

				const addParentOpacity = function (color) {
					if (parentOpacityProp.hasValue()) {
						const p = new svg.Property('color', color);

						return p.addOpacity(parentOpacityProp).value;
					}

					return color;
				};

				const g = this.getGradient(ctx, element);


				if (g == null) return addParentOpacity(stopsContainer.stops[stopsContainer.stops.length - 1].color);

				for (let i=0; i<stopsContainer.stops.length; i++) {
					g.addColorStop(stopsContainer.stops[i].offset, addParentOpacity(stopsContainer.stops[i].color));
				}

				if (this.attribute('gradientTransform').hasValue()) {
					// render as transformed pattern on temporary canvas
					const rootView = svg.ViewPort.viewPorts[0];

					const rect = new svg.Element.rect();

					rect.attributes['x'] = new svg.Property('x', -svg.MAX_VIRTUAL_PIXELS/3.0);
					rect.attributes['y'] = new svg.Property('y', -svg.MAX_VIRTUAL_PIXELS/3.0);
					rect.attributes['width'] = new svg.Property('width', svg.MAX_VIRTUAL_PIXELS);
					rect.attributes['height'] = new svg.Property('height', svg.MAX_VIRTUAL_PIXELS);

					const group = new svg.Element.g();

					group.attributes['transform'] = new svg.Property('transform', this.attribute('gradientTransform').value);
					group.children = [ rect ];

					const tempSvg = new svg.Element.svg();

					tempSvg.attributes['x'] = new svg.Property('x', 0);
					tempSvg.attributes['y'] = new svg.Property('y', 0);
					tempSvg.attributes['width'] = new svg.Property('width', rootView.width);
					tempSvg.attributes['height'] = new svg.Property('height', rootView.height);
					tempSvg.children = [ group ];

					const c = document.createElement('canvas');

					c.width = rootView.width;
					c.height = rootView.height;
					const tempCtx = c.getContext('2d');

					tempCtx.fillStyle = g;
					tempSvg.render(tempCtx);
					return tempCtx.createPattern(c, 'no-repeat');
				}

				return g;
			};
		};
		svg.Element.GradientBase.prototype = new svg.Element.ElementBase;

		// linear gradient element
		svg.Element.linearGradient = function (node) {
			this.base = svg.Element.GradientBase;
			this.base(node);

			this.attributesToInherit.push('x1');
			this.attributesToInherit.push('y1');
			this.attributesToInherit.push('x2');
			this.attributesToInherit.push('y2');

			this.getGradient = function (ctx, element) {
				const bb = this.gradientUnits() == 'objectBoundingBox' ? element.getBoundingBox() : null;

				if (!this.attribute('x1').hasValue()
         && !this.attribute('y1').hasValue()
         && !this.attribute('x2').hasValue()
         && !this.attribute('y2').hasValue()) {
					this.attribute('x1', true).value = 0;
					this.attribute('y1', true).value = 0;
					this.attribute('x2', true).value = 1;
					this.attribute('y2', true).value = 0;
				}

				const x1 = (this.gradientUnits() == 'objectBoundingBox'
					? bb.x() + bb.width() * this.attribute('x1').numValue()
					: this.attribute('x1').toPixels('x'));
				const y1 = (this.gradientUnits() == 'objectBoundingBox'
					? bb.y() + bb.height() * this.attribute('y1').numValue()
					: this.attribute('y1').toPixels('y'));
				const x2 = (this.gradientUnits() == 'objectBoundingBox'
					? bb.x() + bb.width() * this.attribute('x2').numValue()
					: this.attribute('x2').toPixels('x'));
				const y2 = (this.gradientUnits() == 'objectBoundingBox'
					? bb.y() + bb.height() * this.attribute('y2').numValue()
					: this.attribute('y2').toPixels('y'));

				if (x1 == x2 && y1 == y2) return null;

				return ctx.createLinearGradient(x1, y1, x2, y2);
			};
		};
		svg.Element.linearGradient.prototype = new svg.Element.GradientBase;

		// radial gradient element
		svg.Element.radialGradient = function (node) {
			this.base = svg.Element.GradientBase;
			this.base(node);

			this.attributesToInherit.push('cx');
			this.attributesToInherit.push('cy');
			this.attributesToInherit.push('r');
			this.attributesToInherit.push('fx');
			this.attributesToInherit.push('fy');

			this.getGradient = function (ctx, element) {
				const bb = element.getBoundingBox();

				if (!this.attribute('cx').hasValue()) this.attribute('cx', true).value = '50%';

				if (!this.attribute('cy').hasValue()) this.attribute('cy', true).value = '50%';

				if (!this.attribute('r').hasValue()) this.attribute('r', true).value = '50%';

				const cx = (this.gradientUnits() == 'objectBoundingBox'
					? bb.x() + bb.width() * this.attribute('cx').numValue()
					: this.attribute('cx').toPixels('x'));
				const cy = (this.gradientUnits() == 'objectBoundingBox'
					? bb.y() + bb.height() * this.attribute('cy').numValue()
					: this.attribute('cy').toPixels('y'));

				let fx = cx;
				let fy = cy;


				if (this.attribute('fx').hasValue()) {
					fx = (this.gradientUnits() == 'objectBoundingBox'
						? bb.x() + bb.width() * this.attribute('fx').numValue()
						: this.attribute('fx').toPixels('x'));
				}

				if (this.attribute('fy').hasValue()) {
					fy = (this.gradientUnits() == 'objectBoundingBox'
						? bb.y() + bb.height() * this.attribute('fy').numValue()
						: this.attribute('fy').toPixels('y'));
				}

				const r = (this.gradientUnits() == 'objectBoundingBox'
					? (bb.width() + bb.height()) / 2.0 * this.attribute('r').numValue()
					: this.attribute('r').toPixels());

				return ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
			};
		};
		svg.Element.radialGradient.prototype = new svg.Element.GradientBase;

		// gradient stop element
		svg.Element.stop = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.offset = this.attribute('offset').numValue();

			if (this.offset < 0) this.offset = 0;

			if (this.offset > 1) this.offset = 1;

			let stopColor = this.style('stop-color', true);


			if (stopColor.value === '') stopColor.value = '#000';

			if (this.style('stop-opacity').hasValue()) stopColor = stopColor.addOpacity(this.style('stop-opacity'));

			this.color = stopColor.value;
		};
		svg.Element.stop.prototype = new svg.Element.ElementBase;

		// animation base element
		svg.Element.AnimateBase = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			svg.Animations.push(this);

			this.duration = 0.0;
			this.begin = this.attribute('begin').toMilliseconds();
			this.maxDuration = this.begin + this.attribute('dur').toMilliseconds();

			this.getProperty = function () {
				const attributeType = this.attribute('attributeType').value;
				const attributeName = this.attribute('attributeName').value;

				if (attributeType == 'CSS') {
					return this.parent.style(attributeName, true);
				}

				return this.parent.attribute(attributeName, true);
			};

			this.initialValue = null;
			this.initialUnits = '';
			this.removed = false;

			this.calcValue = function () {
				// OVERRIDE ME!
				return '';
			};

			this.update = function (delta) {
				// set initial value
				if (this.initialValue == null) {
					this.initialValue = this.getProperty().value;
					this.initialUnits = this.getProperty().getUnits();
				}

				// if we're past the end time
				if (this.duration > this.maxDuration) {
					// loop for indefinitely repeating animations
					if (this.attribute('repeatCount').value == 'indefinite'
           || this.attribute('repeatDur').value == 'indefinite') {
						this.duration = 0.0;
					} else if (this.attribute('fill').valueOrDefault('remove') == 'freeze' && !this.frozen) {
						this.frozen = true;
						this.parent.animationFrozen = true;
						this.parent.animationFrozenValue = this.getProperty().value;
					} else if (this.attribute('fill').valueOrDefault('remove') == 'remove' && !this.removed) {
						this.removed = true;
						this.getProperty().value = this.parent.animationFrozen ? this.parent.animationFrozenValue : this.initialValue;
						return true;
					}

					return false;
				}

				this.duration = this.duration + delta;

				// if we're past the begin time
				let updated = false;


				if (this.begin < this.duration) {
					let newValue = this.calcValue(); // tween

					if (this.attribute('type').hasValue()) {
						// for transform, etc.
						const type = this.attribute('type').value;

						newValue = type + '(' + newValue + ')';
					}

					this.getProperty().value = newValue;
					updated = true;
				}

				return updated;
			};

			this.from = this.attribute('from');
			this.to = this.attribute('to');
			this.values = this.attribute('values');

			if (this.values.hasValue()) this.values.value = this.values.value.split(';');

			// fraction of duration we've covered
			this.progress = function () {
				const ret = { progress: (this.duration - this.begin) / (this.maxDuration - this.begin) };


				if (this.values.hasValue()) {
					const p = ret.progress * (this.values.value.length - 1);
					const lb = Math.floor(p); const ub = Math.ceil(p);

					ret.from = new svg.Property('from', parseFloat(this.values.value[lb]));
					ret.to = new svg.Property('to', parseFloat(this.values.value[ub]));
					ret.progress = (p - lb) / (ub - lb);
				} else {
					ret.from = this.from;
					ret.to = this.to;
				}

				return ret;
			};
		};
		svg.Element.AnimateBase.prototype = new svg.Element.ElementBase;

		// animate element
		svg.Element.animate = function (node) {
			this.base = svg.Element.AnimateBase;
			this.base(node);

			this.calcValue = function () {
				const p = this.progress();

				// tween value linearly
				const newValue = p.from.numValue() + (p.to.numValue() - p.from.numValue()) * p.progress;

				return newValue + this.initialUnits;
			};
		};
		svg.Element.animate.prototype = new svg.Element.AnimateBase;

		// animate color element
		svg.Element.animateColor = function (node) {
			this.base = svg.Element.AnimateBase;
			this.base(node);

			this.calcValue = function () {
				const p = this.progress();
				const from = new RGBColor(p.from.value);
				const to = new RGBColor(p.to.value);

				if (from.ok && to.ok) {
					// tween color linearly
					const r = from.r + (to.r - from.r) * p.progress;
					const g = from.g + (to.g - from.g) * p.progress;
					const b = from.b + (to.b - from.b) * p.progress;

					return 'rgb('+parseInt(r,10)+','+parseInt(g,10)+','+parseInt(b,10)+')';
				}

				return this.attribute('from').value;
			};
		};
		svg.Element.animateColor.prototype = new svg.Element.AnimateBase;

		// animate transform element
		svg.Element.animateTransform = function (node) {
			this.base = svg.Element.AnimateBase;
			this.base(node);

			this.calcValue = function () {
				const p = this.progress();

				// tween value linearly
				const from = svg.ToNumberArray(p.from.value);
				const to = svg.ToNumberArray(p.to.value);
				let newValue = '';

				for (let i=0; i<from.length; i++) {
					newValue += from[i] + (to[i] - from[i]) * p.progress + ' ';
				}
				return newValue;
			};
		};
		svg.Element.animateTransform.prototype = new svg.Element.animate;

		// font element
		svg.Element.font = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.horizAdvX = this.attribute('horiz-adv-x').numValue();

			this.isRTL = false;
			this.isArabic = false;
			this.fontFace = null;
			this.missingGlyph = null;
			this.glyphs = [];
			for (let i=0; i<this.children.length; i++) {
				const child = this.children[i];


				if (child.type == 'font-face') {
					this.fontFace = child;

					if (child.style('font-family').hasValue()) {
						svg.Definitions[child.style('font-family').value] = this;
					}
				} else if (child.type == 'missing-glyph') this.missingGlyph = child;
				else if (child.type == 'glyph') {
					if (child.arabicForm != '') {
						this.isRTL = true;
						this.isArabic = true;

						if (typeof this.glyphs[child.unicode] === 'undefined') this.glyphs[child.unicode] = [];

						this.glyphs[child.unicode][child.arabicForm] = child;
					} else {
						this.glyphs[child.unicode] = child;
					}
				}
			}
		};
		svg.Element.font.prototype = new svg.Element.ElementBase;

		// font-face element
		svg.Element.fontface = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.ascent = this.attribute('ascent').value;
			this.descent = this.attribute('descent').value;
			this.unitsPerEm = this.attribute('units-per-em').numValue();
		};
		svg.Element.fontface.prototype = new svg.Element.ElementBase;

		// missing-glyph element
		svg.Element.missingglyph = function (node) {
			this.base = svg.Element.path;
			this.base(node);

			this.horizAdvX = 0;
		};
		svg.Element.missingglyph.prototype = new svg.Element.path;

		// glyph element
		svg.Element.glyph = function (node) {
			this.base = svg.Element.path;
			this.base(node);

			this.horizAdvX = this.attribute('horiz-adv-x').numValue();
			this.unicode = this.attribute('unicode').value;
			this.arabicForm = this.attribute('arabic-form').value;
		};
		svg.Element.glyph.prototype = new svg.Element.path;

		// text element
		svg.Element.text = function (node) {
			this.captureTextNodes = true;
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.baseSetContext = this.setContext;
			this.setContext = function (ctx) {
				this.baseSetContext(ctx);

				let textBaseline = this.style('dominant-baseline').toTextBaseline();


				if (textBaseline == null) textBaseline = this.style('alignment-baseline').toTextBaseline();

				if (textBaseline != null) ctx.textBaseline = textBaseline;
			};

			this.getBoundingBox = function () {
				const x = this.attribute('x').toPixels('x');
				const y = this.attribute('y').toPixels('y');
				const fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);

				return new svg.BoundingBox(x, y - fontSize, x + Math.floor(fontSize * 2.0 / 3.0) * this.children[0].getText().length, y);
			};

			this.renderChildren = function (ctx) {
				this.x = this.attribute('x').toPixels('x');
				this.y = this.attribute('y').toPixels('y');

				if (this.attribute('dx').hasValue()) this.x += this.attribute('dx').toPixels('x');

				if (this.attribute('dy').hasValue()) this.y += this.attribute('dy').toPixels('y');

				this.x += this.getAnchorDelta(ctx, this, 0);
				for (let i=0; i<this.children.length; i++) {
					this.renderChild(ctx, this, this, i);
				}
			};

			this.getAnchorDelta = function (ctx, parent, startI) {
				const textAnchor = this.style('text-anchor').valueOrDefault('start');


				if (textAnchor != 'start') {
					let width = 0;

					for (let i=startI; i<parent.children.length; i++) {
						const child = parent.children[i];


						if (i > startI && child.attribute('x').hasValue()) break; // new group

						width += child.measureTextRecursive(ctx);
					}
					return -1 * (textAnchor == 'end' ? width : width / 2.0);
				}

				return 0;
			};

			this.renderChild = function (ctx, textParent, parent, i) {
				const child = parent.children[i];


				if (child.attribute('x').hasValue()) {
					child.x = child.attribute('x').toPixels('x') + textParent.getAnchorDelta(ctx, parent, i);

					if (child.attribute('dx').hasValue()) child.x += child.attribute('dx').toPixels('x');
				} else {
					if (child.attribute('dx').hasValue()) textParent.x += child.attribute('dx').toPixels('x');

					child.x = textParent.x;
				}

				textParent.x = child.x + child.measureText(ctx);

				if (child.attribute('y').hasValue()) {
					child.y = child.attribute('y').toPixels('y');

					if (child.attribute('dy').hasValue()) child.y += child.attribute('dy').toPixels('y');
				} else {
					if (child.attribute('dy').hasValue()) textParent.y += child.attribute('dy').toPixels('y');

					child.y = textParent.y;
				}

				textParent.y = child.y;

				child.render(ctx);

				for (var i=0; i<child.children.length; i++) {
					textParent.renderChild(ctx, textParent, child, i);
				}
			};
		};
		svg.Element.text.prototype = new svg.Element.RenderedElementBase;

		// text base
		svg.Element.TextElementBase = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.getGlyph = function (font, text, i) {
				const c = text[i];
				let glyph = null;


				if (font.isArabic) {
					let arabicForm = 'isolated';


					if ((i==0 || text[i-1]==' ') && i<text.length-2 && text[i+1]!=' ') arabicForm = 'terminal';

					if (i>0 && text[i-1]!=' ' && i<text.length-2 && text[i+1]!=' ') arabicForm = 'medial';

					if (i>0 && text[i-1]!=' ' && (i == text.length-1 || text[i+1]==' ')) arabicForm = 'initial';

					if (typeof font.glyphs[c] !== 'undefined') {
						glyph = font.glyphs[c][arabicForm];

						if (glyph == null && font.glyphs[c].type == 'glyph') glyph = font.glyphs[c];
					}
				} else {
					glyph = font.glyphs[c];
				}

				if (glyph == null) glyph = font.missingGlyph;

				return glyph;
			};

			this.renderChildren = function (ctx) {
				const customFont = this.parent.style('font-family').getDefinition();


				if (customFont != null) {
					const fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
					const fontStyle = this.parent.style('font-style').valueOrDefault(svg.Font.Parse(svg.ctx.font).fontStyle);
					let text = this.getText();


					if (customFont.isRTL) text = text.split("").reverse().join("");

					const dx = svg.ToNumberArray(this.parent.attribute('dx').value);

					for (let i=0; i<text.length; i++) {
						const glyph = this.getGlyph(customFont, text, i);
						const scale = fontSize / customFont.fontFace.unitsPerEm;

						ctx.translate(this.x, this.y);
						ctx.scale(scale, -scale);
						const lw = ctx.lineWidth;

						ctx.lineWidth = ctx.lineWidth * customFont.fontFace.unitsPerEm / fontSize;

						if (fontStyle == 'italic') ctx.transform(1, 0, .4, 1, 0, 0);

						glyph.render(ctx);

						if (fontStyle == 'italic') ctx.transform(1, 0, -.4, 1, 0, 0);

						ctx.lineWidth = lw;
						ctx.scale(1/scale, -1/scale);
						ctx.translate(-this.x, -this.y);

						this.x += fontSize * (glyph.horizAdvX || customFont.horizAdvX) / customFont.fontFace.unitsPerEm;

						if (typeof dx[i] !== 'undefined' && !isNaN(dx[i])) {
							this.x += dx[i];
						}
					}
					return;
				}

				if (ctx.fillStyle != '') ctx.fillText(svg.compressSpaces(this.getText()), this.x, this.y);

				if (ctx.strokeStyle != '') ctx.strokeText(svg.compressSpaces(this.getText()), this.x, this.y);
			};

			this.getText = function () {
				// OVERRIDE ME
			};

			this.measureTextRecursive = function (ctx) {
				let width = this.measureText(ctx);

				for (let i=0; i<this.children.length; i++) {
					width += this.children[i].measureTextRecursive(ctx);
				}
				return width;
			};

			this.measureText = function (ctx) {
				const customFont = this.parent.style('font-family').getDefinition();


				if (customFont != null) {
					const fontSize = this.parent.style('font-size').numValueOrDefault(svg.Font.Parse(svg.ctx.font).fontSize);
					let measure = 0;
					let text = this.getText();


					if (customFont.isRTL) text = text.split("").reverse().join("");

					const dx = svg.ToNumberArray(this.parent.attribute('dx').value);

					for (let i=0; i<text.length; i++) {
						const glyph = this.getGlyph(customFont, text, i);

						measure += (glyph.horizAdvX || customFont.horizAdvX) * fontSize / customFont.fontFace.unitsPerEm;

						if (typeof dx[i] !== 'undefined' && !isNaN(dx[i])) {
							measure += dx[i];
						}
					}
					return measure;
				}

				const textToMeasure = svg.compressSpaces(this.getText());


				if (!ctx.measureText) return textToMeasure.length * 10;

				ctx.save();
				this.setContext(ctx);
				const width = ctx.measureText(textToMeasure).width;

				ctx.restore();
				return width;
			};
		};
		svg.Element.TextElementBase.prototype = new svg.Element.RenderedElementBase;

		// tspan
		svg.Element.tspan = function (node) {
			this.captureTextNodes = true;
			this.base = svg.Element.TextElementBase;
			this.base(node);

			this.text = svg.compressSpaces(node.value || node.text || node.textContent || '');
			this.getText = function () {
				// if this node has children, then they own the text
				if (this.children.length > 0) {
					return '';
				}

				return this.text;
			};
		};
		svg.Element.tspan.prototype = new svg.Element.TextElementBase;

		// tref
		svg.Element.tref = function (node) {
			this.base = svg.Element.TextElementBase;
			this.base(node);

			this.getText = function () {
				const element = this.getHrefAttribute().getDefinition();


				if (element != null) return element.children[0].getText();
			};
		};
		svg.Element.tref.prototype = new svg.Element.TextElementBase;

		// a element
		svg.Element.a = function (node) {
			this.base = svg.Element.TextElementBase;
			this.base(node);

			this.hasText = node.childNodes.length > 0;
			for (let i=0; i<node.childNodes.length; i++) {
				if (node.childNodes[i].nodeType != 3) this.hasText = false;
			}

			// this might contain text
			this.text = this.hasText ? node.childNodes[0].value : '';
			this.getText = function () {
				return this.text;
			};

			this.baseRenderChildren = this.renderChildren;
			this.renderChildren = function (ctx) {
				if (this.hasText) {
					// render as text element
					this.baseRenderChildren(ctx);
					const fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);

					svg.Mouse.checkBoundingBox(this, new svg.BoundingBox(this.x, this.y - fontSize.toPixels('y'), this.x + this.measureText(ctx), this.y));
				} else if (this.children.length > 0) {
					// render as temporary group
					const g = new svg.Element.g();

					g.children = this.children;
					g.parent = this;
					g.render(ctx);
				}
			};

			this.onclick = function () {
				window.open(this.getHrefAttribute().value);
			};

			this.onmousemove = function () {
				svg.ctx.canvas.style.cursor = 'pointer';
			};
		};
		svg.Element.a.prototype = new svg.Element.TextElementBase;

		// image element
		svg.Element.image = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			const href = this.getHrefAttribute().value;


			if (href == '') {
				return;
			}

			const isSvg = href.match(/\.svg$/);

			svg.Images.push(this);
			this.loaded = false;

			if (!isSvg) {
				this.img = document.createElement('img');

				if (svg.opts['useCORS'] == true) {
					this.img.crossOrigin = 'Anonymous';
				}

				const self = this;

				this.img.onload = function () {
					self.loaded = true;
				};
				this.img.onerror = function () {
					svg.log('ERROR: image "' + href + '" not found'); self.loaded = true;
				};
				this.img.src = href;
			} else {
				this.img = svg.ajax(href);
				this.loaded = true;
			}

			this.renderChildren = function (ctx) {
				const x = this.attribute('x').toPixels('x');
				const y = this.attribute('y').toPixels('y');

				const width = this.attribute('width').toPixels('x');
				const height = this.attribute('height').toPixels('y');


				if (width == 0 || height == 0) return;

				ctx.save();

				if (isSvg) {
					ctx.drawSvg(this.img, x, y, width, height);
				} else {
					ctx.translate(x, y);
					svg.AspectRatio(ctx,
						this.attribute('preserveAspectRatio').value,
						width,
						this.img.width,
						height,
						this.img.height,
						0,
						0);
					ctx.drawImage(this.img, 0, 0);
				}

				ctx.restore();
			};

			this.getBoundingBox = function () {
				const x = this.attribute('x').toPixels('x');
				const y = this.attribute('y').toPixels('y');
				const width = this.attribute('width').toPixels('x');
				const height = this.attribute('height').toPixels('y');

				return new svg.BoundingBox(x, y, x + width, y + height);
			};
		};
		svg.Element.image.prototype = new svg.Element.RenderedElementBase;

		// group element
		svg.Element.g = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.getBoundingBox = function () {
				const bb = new svg.BoundingBox();

				for (let i=0; i<this.children.length; i++) {
					bb.addBoundingBox(this.children[i].getBoundingBox());
				}
				return bb;
			};
		};
		svg.Element.g.prototype = new svg.Element.RenderedElementBase;

		// symbol element
		svg.Element.symbol = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.render = function (ctx) {
				// NO RENDER
			};
		};
		svg.Element.symbol.prototype = new svg.Element.RenderedElementBase;

		// style element
		svg.Element.style = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			// text, or spaces then CDATA
			let css = '';

			for (var i=0; i<node.childNodes.length; i++) {
				css += node.childNodes[i].data;
			}
			css = css.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(^[\s]*\/\/.*)/gm, ''); // remove comments
			css = svg.compressSpaces(css); // replace whitespace
			const cssDefs = css.split('}');

			for (var i=0; i<cssDefs.length; i++) {
				if (svg.trim(cssDefs[i]) != '') {
					const cssDef = cssDefs[i].split('{');
					const cssClasses = cssDef[0].split(',');
					const cssProps = cssDef[1].split(';');

					for (let j=0; j<cssClasses.length; j++) {
						const cssClass = svg.trim(cssClasses[j]);


						if (cssClass != '') {
							const props = svg.Styles[cssClass] || {};

							for (let k=0; k<cssProps.length; k++) {
								const prop = cssProps[k].indexOf(':');
								const name = cssProps[k].substr(0, prop);
								const value = cssProps[k].substr(prop + 1, cssProps[k].length - prop);


								if (name != null && value != null) {
									props[svg.trim(name)] = new svg.Property(svg.trim(name), svg.trim(value));
								}
							}
							svg.Styles[cssClass] = props;
							svg.StylesSpecificity[cssClass] = getSelectorSpecificity(cssClass);

							if (cssClass == '@font-face') {
								const fontFamily = props['font-family'].value.replace(/"/g,'');
								const srcs = props['src'].value.split(',');

								for (let s=0; s<srcs.length; s++) {
									if (srcs[s].indexOf('format("svg")') > 0) {
										const urlStart = srcs[s].indexOf('url');
										const urlEnd = srcs[s].indexOf(')', urlStart);
										const url = srcs[s].substr(urlStart + 5, urlEnd - urlStart - 6);
										const doc = svg.parseXml(svg.ajax(url));
										const fonts = doc.getElementsByTagName('font');

										for (let f=0; f<fonts.length; f++) {
											const font = svg.CreateElement(fonts[f]);

											svg.Definitions[fontFamily] = font;
										}
									}
								}
							}
						}
					}
				}
			}
		};
		svg.Element.style.prototype = new svg.Element.ElementBase;

		// use element
		svg.Element.use = function (node) {
			this.base = svg.Element.RenderedElementBase;
			this.base(node);

			this.baseSetContext = this.setContext;
			this.setContext = function (ctx) {
				this.baseSetContext(ctx);

				if (this.attribute('x').hasValue()) ctx.translate(this.attribute('x').toPixels('x'), 0);

				if (this.attribute('y').hasValue()) ctx.translate(0, this.attribute('y').toPixels('y'));
			};

			const element = this.getHrefAttribute().getDefinition();

			this.path = function (ctx) {
				if (element != null) element.path(ctx);
			};

			this.getBoundingBox = function () {
				if (element != null) return element.getBoundingBox();
			};

			this.renderChildren = function (ctx) {
				if (element != null) {
					let tempSvg = element;


					if (element.type == 'symbol') {
						// render me using a temporary svg element in symbol cases (http://www.w3.org/TR/SVG/struct.html#UseElement)
						tempSvg = new svg.Element.svg();
						tempSvg.type = 'svg';
						tempSvg.attributes['viewBox'] = new svg.Property('viewBox', element.attribute('viewBox').value);
						tempSvg.attributes['preserveAspectRatio'] = new svg.Property('preserveAspectRatio', element.attribute('preserveAspectRatio').value);
						tempSvg.attributes['overflow'] = new svg.Property('overflow', element.attribute('overflow').value);
						tempSvg.children = element.children;
					}

					if (tempSvg.type == 'svg') {
						// if symbol or svg, inherit width/height from me
						if (this.attribute('width').hasValue()) tempSvg.attributes['width'] = new svg.Property('width', this.attribute('width').value);

						if (this.attribute('height').hasValue()) tempSvg.attributes['height'] = new svg.Property('height', this.attribute('height').value);
					}

					const oldParent = tempSvg.parent;

					tempSvg.parent = null;
					tempSvg.render(ctx);
					tempSvg.parent = oldParent;
				}
			};
		};
		svg.Element.use.prototype = new svg.Element.RenderedElementBase;

		// mask element
		svg.Element.mask = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.apply = function (ctx, element) {
				// render as temp svg
				var x = this.attribute('x').toPixels('x');
				var y = this.attribute('y').toPixels('y');
				var width = this.attribute('width').toPixels('x');
				var height = this.attribute('height').toPixels('y');

				if (width == 0 && height == 0) {
					const bb = new svg.BoundingBox();

					for (let i=0; i<this.children.length; i++) {
						bb.addBoundingBox(this.children[i].getBoundingBox());
					}
					var x = Math.floor(bb.x1);
					var y = Math.floor(bb.y1);
					var width = Math.floor(bb.width());
					var height = Math.floor(bb.height());
				}

				// temporarily remove mask to avoid recursion
				const mask = element.attribute('mask').value;

				element.attribute('mask').value = '';

				const cMask = document.createElement('canvas');

				cMask.width = x + width;
				cMask.height = y + height;
				const maskCtx = cMask.getContext('2d');

				this.renderChildren(maskCtx);

				const c = document.createElement('canvas');

				c.width = x + width;
				c.height = y + height;
				const tempCtx = c.getContext('2d');

				element.render(tempCtx);
				tempCtx.globalCompositeOperation = 'destination-in';
				tempCtx.fillStyle = maskCtx.createPattern(cMask, 'no-repeat');
				tempCtx.fillRect(0, 0, x + width, y + height);

				ctx.fillStyle = tempCtx.createPattern(c, 'no-repeat');
				ctx.fillRect(0, 0, x + width, y + height);

				// reassign mask
				element.attribute('mask').value = mask;
			};

			this.render = function (ctx) {
				// NO RENDER
			};
		};
		svg.Element.mask.prototype = new svg.Element.ElementBase;

		// clip element
		svg.Element.clipPath = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.apply = function (ctx) {
				const oldBeginPath = CanvasRenderingContext2D.prototype.beginPath;

				CanvasRenderingContext2D.prototype.beginPath = function () { };

				const oldClosePath = CanvasRenderingContext2D.prototype.closePath;

				CanvasRenderingContext2D.prototype.closePath = function () { };

				oldBeginPath.call(ctx);
				for (let i=0; i<this.children.length; i++) {
					const child = this.children[i];


					if (typeof child.path !== 'undefined') {
						let transform = null;


						if (child.style('transform', false, true).hasValue()) {
							transform = new svg.Transform(child.style('transform', false, true).value);
							transform.apply(ctx);
						}

						child.path(ctx);
						CanvasRenderingContext2D.prototype.closePath = oldClosePath;

						if (transform) {
							transform.unapply(ctx);
						}
					}
				}
				oldClosePath.call(ctx);
				ctx.clip();

				CanvasRenderingContext2D.prototype.beginPath = oldBeginPath;
				CanvasRenderingContext2D.prototype.closePath = oldClosePath;
			};

			this.render = function (ctx) {
				// NO RENDER
			};
		};
		svg.Element.clipPath.prototype = new svg.Element.ElementBase;

		// filters
		svg.Element.filter = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.apply = function (ctx, element) {
				// render as temp svg
				const bb = element.getBoundingBox();
				const x = Math.floor(bb.x1);
				const y = Math.floor(bb.y1);
				const width = Math.floor(bb.width());
				const height = Math.floor(bb.height());

				// temporarily remove filter to avoid recursion
				const filter = element.style('filter').value;

				element.style('filter').value = '';

				let px = 0; let py = 0;

				for (var i=0; i<this.children.length; i++) {
					const efd = this.children[i].extraFilterDistance || 0;

					px = Math.max(px, efd);
					py = Math.max(py, efd);
				}

				const c = document.createElement('canvas');

				c.width = width + 2*px;
				c.height = height + 2*py;
				const tempCtx = c.getContext('2d');

				tempCtx.translate(-x + px, -y + py);
				element.render(tempCtx);

				// apply filters
				for (var i=0; i<this.children.length; i++) {
					if (typeof this.children[i].apply === 'function') {
						this.children[i].apply(tempCtx, 0, 0, width + 2*px, height + 2*py);
					}
				}

				// render on me
				ctx.drawImage(c, 0, 0, width + 2*px, height + 2*py, x - px, y - py, width + 2*px, height + 2*py);

				// reassign filter
				element.style('filter', true).value = filter;
			};

			this.render = function (ctx) {
				// NO RENDER
			};
		};
		svg.Element.filter.prototype = new svg.Element.ElementBase;

		svg.Element.feMorphology = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.apply = function (ctx, x, y, width, height) {
			};
		};
		svg.Element.feMorphology.prototype = new svg.Element.ElementBase;

		svg.Element.feComposite = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.apply = function (ctx, x, y, width, height) {
			};
		};
		svg.Element.feComposite.prototype = new svg.Element.ElementBase;

		svg.Element.feColorMatrix = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			let matrix = svg.ToNumberArray(this.attribute('values').value);

			switch (this.attribute('type').valueOrDefault('matrix')) { // http://www.w3.org/TR/SVG/filters.html#feColorMatrixElement
				case 'saturate':
					var s = matrix[0];

					matrix = [0.213+0.787*s,0.715-0.715*s,0.072-0.072*s,0,0,
						0.213-0.213*s,0.715+0.285*s,0.072-0.072*s,0,0,
						0.213-0.213*s,0.715-0.715*s,0.072+0.928*s,0,0,
						0,0,0,1,0,
						0,0,0,0,1];
					break;
				case 'hueRotate':
					var a = matrix[0] * Math.PI / 180.0;
					var c = function (m1,m2,m3) {
						return m1 + Math.cos(a)*m2 + Math.sin(a)*m3;
					};

					matrix = [c(0.213,0.787,-0.213),c(0.715,-0.715,-0.715),c(0.072,-0.072,0.928),0,0,
						c(0.213,-0.213,0.143),c(0.715,0.285,0.140),c(0.072,-0.072,-0.283),0,0,
						c(0.213,-0.213,-0.787),c(0.715,-0.715,0.715),c(0.072,0.928,0.072),0,0,
						0,0,0,1,0,
						0,0,0,0,1];
					break;
				case 'luminanceToAlpha':
					matrix = [0,0,0,0,0,
						0,0,0,0,0,
						0,0,0,0,0,
						0.2125,0.7154,0.0721,0,0,
						0,0,0,0,1];
					break;
			}

			function imGet(img, x, y, width, height, rgba) {
				return img[y*width*4 + x*4 + rgba];
			}

			function imSet(img, x, y, width, height, rgba, val) {
				img[y*width*4 + x*4 + rgba] = val;
			}

			function m(i, v) {
				const mi = matrix[i];

				return mi * (mi < 0 ? v - 255 : v);
			}

			this.apply = function (ctx, x, y, width, height) {
				// assuming x==0 && y==0 for now
				const srcData = ctx.getImageData(0, 0, width, height);

				for (var y = 0; y < height; y++) {
					for (var x = 0; x < width; x++) {
						const r = imGet(srcData.data, x, y, width, height, 0);
						const g = imGet(srcData.data, x, y, width, height, 1);
						const b = imGet(srcData.data, x, y, width, height, 2);
						const a = imGet(srcData.data, x, y, width, height, 3);

						imSet(srcData.data, x, y, width, height, 0, m(0,r)+m(1,g)+m(2,b)+m(3,a)+m(4,1));
						imSet(srcData.data, x, y, width, height, 1, m(5,r)+m(6,g)+m(7,b)+m(8,a)+m(9,1));
						imSet(srcData.data, x, y, width, height, 2, m(10,r)+m(11,g)+m(12,b)+m(13,a)+m(14,1));
						imSet(srcData.data, x, y, width, height, 3, m(15,r)+m(16,g)+m(17,b)+m(18,a)+m(19,1));
					}
				}
				ctx.clearRect(0, 0, width, height);
				ctx.putImageData(srcData, 0, 0);
			};
		};
		svg.Element.feColorMatrix.prototype = new svg.Element.ElementBase;

		svg.Element.feGaussianBlur = function (node) {
			this.base = svg.Element.ElementBase;
			this.base(node);

			this.blurRadius = Math.floor(this.attribute('stdDeviation').numValue());
			this.extraFilterDistance = this.blurRadius;

			this.apply = function (ctx, x, y, width, height) {
				if (typeof stackBlur.canvasRGBA === 'undefined') {
					svg.log('ERROR: StackBlur.js must be included for blur to work');
					return;
				}

				// StackBlur requires canvas be on document
				ctx.canvas.id = svg.UniqueId();
				ctx.canvas.style.display = 'none';
				document.body.appendChild(ctx.canvas);
				stackBlur.canvasRGBA(ctx.canvas.id, x, y, width, height, this.blurRadius);
				document.body.removeChild(ctx.canvas);
			};
		};
		svg.Element.feGaussianBlur.prototype = new svg.Element.ElementBase;

		// title element, do nothing
		svg.Element.title = function (node) {
		};
		svg.Element.title.prototype = new svg.Element.ElementBase;

		// desc element, do nothing
		svg.Element.desc = function (node) {
		};
		svg.Element.desc.prototype = new svg.Element.ElementBase;

		svg.Element.MISSING = function (node) {
			svg.log('ERROR: Element \'' + node.nodeName + '\' not yet implemented.');
		};
		svg.Element.MISSING.prototype = new svg.Element.ElementBase;

		// element factory
		svg.CreateElement = function (node) {
			let className = node.nodeName.replace(/^[^:]+:/,''); // remove namespace

			className = className.replace(/\-/g,''); // remove dashes
			let e = null;


			if (typeof svg.Element[className] !== 'undefined') {
				e = new svg.Element[className](node);
			} else {
				e = new svg.Element.MISSING(node);
			}

			e.type = node.nodeName;
			return e;
		};

		// load from url
		svg.load = function (ctx, url) {
			svg.loadXml(ctx, svg.ajax(url));
		};

		// load from xml
		svg.loadXml = function (ctx, xml) {
			svg.loadXmlDoc(ctx, svg.parseXml(xml));
		};

		svg.loadXmlDoc = function (ctx, dom) {
			svg.init(ctx);

			const mapXY = function (p) {
				let e = ctx.canvas;

				while (e) {
					p.x -= e.offsetLeft;
					p.y -= e.offsetTop;
					e = e.offsetParent;
				}

				if (window.scrollX) p.x += window.scrollX;

				if (window.scrollY) p.y += window.scrollY;

				return p;
			};

			// bind mouse
			if (svg.opts['ignoreMouse'] != true) {
				ctx.canvas.onclick = function (e) {
					const p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));

					svg.Mouse.onclick(p.x, p.y);
				};
				ctx.canvas.onmousemove = function (e) {
					const p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));

					svg.Mouse.onmousemove(p.x, p.y);
				};
			}

			const e = svg.CreateElement(dom.documentElement);

			e.root = true;
			e.addStylesFromStyleDefinition();

			// render loop
			let isFirstRender = true;
			const draw = function () {
				svg.ViewPort.Clear();

				if (ctx.canvas.parentNode) svg.ViewPort.SetCurrent(ctx.canvas.parentNode.clientWidth, ctx.canvas.parentNode.clientHeight);

				if (svg.opts['ignoreDimensions'] != true) {
					// set canvas size
					if (e.style('width').hasValue()) {
						ctx.canvas.width = e.style('width').toPixels('x');
						ctx.canvas.style.width = ctx.canvas.width + 'px';
					}

					if (e.style('height').hasValue()) {
						ctx.canvas.height = e.style('height').toPixels('y');
						ctx.canvas.style.height = ctx.canvas.height + 'px';
					}
				}

				let cWidth = ctx.canvas.clientWidth || ctx.canvas.width;
				let cHeight = ctx.canvas.clientHeight || ctx.canvas.height;


				if (svg.opts['ignoreDimensions'] == true && e.style('width').hasValue() && e.style('height').hasValue()) {
					cWidth = e.style('width').toPixels('x');
					cHeight = e.style('height').toPixels('y');
				}

				svg.ViewPort.SetCurrent(cWidth, cHeight);

				if (svg.opts['offsetX'] != null) e.attribute('x', true).value = svg.opts['offsetX'];

				if (svg.opts['offsetY'] != null) e.attribute('y', true).value = svg.opts['offsetY'];

				if (svg.opts['scaleWidth'] != null || svg.opts['scaleHeight'] != null) {
					let xRatio = null; let yRatio = null; const viewBox = svg.ToNumberArray(e.attribute('viewBox').value);

					if (svg.opts['scaleWidth'] != null) {
						if (e.attribute('width').hasValue()) xRatio = e.attribute('width').toPixels('x') / svg.opts['scaleWidth'];
						else if (!isNaN(viewBox[2])) xRatio = viewBox[2] / svg.opts['scaleWidth'];
					}

					if (svg.opts['scaleHeight'] != null) {
						if (e.attribute('height').hasValue()) yRatio = e.attribute('height').toPixels('y') / svg.opts['scaleHeight'];
						else if (!isNaN(viewBox[3])) yRatio = viewBox[3] / svg.opts['scaleHeight'];
					}

					if (xRatio == null) {
						xRatio = yRatio;
					}

					if (yRatio == null) {
						yRatio = xRatio;
					}

					e.attribute('width', true).value = svg.opts['scaleWidth'];
					e.attribute('height', true).value = svg.opts['scaleHeight'];
					e.style('transform', true, true).value += ' scale('+(1.0/xRatio)+','+(1.0/yRatio)+')';
				}

				// clear and render
				if (svg.opts['ignoreClear'] != true) {
					ctx.clearRect(0, 0, cWidth, cHeight);
				}

				e.render(ctx);

				if (isFirstRender) {
					isFirstRender = false;

					if (typeof svg.opts['renderCallback'] === 'function') svg.opts['renderCallback'](dom);
				}
			};

			let waitingForImages = true;


			if (svg.ImagesLoaded()) {
				waitingForImages = false;
				draw();
			}

			svg.intervalID = setInterval(function () {
				let needUpdate = false;

				if (waitingForImages && svg.ImagesLoaded()) {
					waitingForImages = false;
					needUpdate = true;
				}

				// need update from mouse events?
				if (svg.opts['ignoreMouse'] != true) {
					needUpdate = needUpdate | svg.Mouse.hasEvents();
				}

				// need update from animations?
				if (svg.opts['ignoreAnimation'] != true) {
					for (let i=0; i<svg.Animations.length; i++) {
						needUpdate = needUpdate | svg.Animations[i].update(1000 / svg.FRAMERATE);
					}
				}

				// need update from redraw?
				if (typeof svg.opts['forceRedraw'] === 'function') {
					if (svg.opts['forceRedraw']() == true) needUpdate = true;
				}

				// render if needed
				if (needUpdate) {
					draw();
					svg.Mouse.runEvents(); // run and clear our events
				}
			}, 1000 / svg.FRAMERATE);
		};

		svg.stop = function () {
			if (svg.intervalID) {
				clearInterval(svg.intervalID);
			}
		};

		svg.Mouse = new (function () {
			this.events = [];
			this.hasEvents = function () {
				return this.events.length != 0;
			};

			this.onclick = function (x, y) {
				this.events.push({ type: 'onclick', x: x, y: y,
					run: function (e) {
						if (e.onclick) e.onclick();
					},
				});
			};

			this.onmousemove = function (x, y) {
				this.events.push({ type: 'onmousemove', x: x, y: y,
					run: function (e) {
						if (e.onmousemove) e.onmousemove();
					},
				});
			};

			this.eventElements = [];

			this.checkPath = function (element, ctx) {
				for (let i=0; i<this.events.length; i++) {
					const e = this.events[i];


					if (ctx.isPointInPath && ctx.isPointInPath(e.x, e.y)) this.eventElements[i] = element;
				}
			};

			this.checkBoundingBox = function (element, bb) {
				for (let i=0; i<this.events.length; i++) {
					const e = this.events[i];


					if (bb.isPointInBox(e.x, e.y)) this.eventElements[i] = element;
				}
			};

			this.runEvents = function () {
				svg.ctx.canvas.style.cursor = '';

				for (let i=0; i<this.events.length; i++) {
					const e = this.events[i];
					let element = this.eventElements[i];

					while (element) {
						e.run(element);
						element = element.parent;
					}
				}

				// done running, clear
				this.events = [];
				this.eventElements = [];
			};
		});

		return svg;
	};

	if (typeof CanvasRenderingContext2D  !== 'undefined') {
		CanvasRenderingContext2D.prototype.drawSvg = function (s, dx, dy, dw, dh, opts) {
			const cOpts = {
				ignoreMouse: true,
				ignoreAnimation: true,
				ignoreDimensions: true,
				ignoreClear: true,
				offsetX: dx,
				offsetY: dy,
				scaleWidth: dw,
				scaleHeight: dh,
			};

			for (const prop in opts) {
				if (opts.hasOwnProperty(prop)) {
					cOpts[prop] = opts[prop];
				}
			}
			canvg(this.canvas, s, cOpts);
		};
	}

	return canvg;

}));
