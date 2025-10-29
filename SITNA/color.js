
const colorUtilities = {
	hueToRgb: function ([p, q, t]) {
		colorUtilities.assertArrayColor([p, q, t]);

        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    },

    hslToRgb: function ([h, s, l]) { // h, s, l entre 0 y 1
		var r, g, b;
        colorUtilities.assertArrayColor([h, s, l]);

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = colorUtilities.hueToRgb([p, q, h + 1 / 3]);
            g = colorUtilities.hueToRgb([p, q, h]);
            b = colorUtilities.hueToRgb([p, q, h - 1 / 3]);
        }

        return [r, g, b]; // devuelve r, g, b entre 0 y 1
	},

	rgbToHsl: function ([r, g, b]) { // r, g, b entre 0 y 1
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;

		if (max == min) {
			h = s = 0; // achromatic
		} else {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return [h, s, l];
	},

	hexToRgb: function (s) {
		colorUtilities.assertHexColor(s);

		// Also support the short syntax (ie "#FFF") as input.
		const n = parseInt((s.length === 4 ? s[0] + s[1] + s[1] + s[2] + s[2] + s[3] + s[3] : s).substring(1), 16);
        return [n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff] // devuelve r, g, b entre 0 y 255
	},

	rgbToHex: function ([r, g, b]) { // r, g, b entre 0 y 255
		colorUtilities.assertArrayColor([r, g, b]);

		const toHex = (value) => value.toString(16).padStart(2, '0');
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	},

	rgbToXyz: function ([r, g, b]) { // r, g, b tienen valores entre 0 y 1
		colorUtilities.assertArrayColor([r, g, b]);

		// Apply a gamma correction to each channel.
		r = r < 0.040448236277105097 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
		g = g < 0.040448236277105097 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
		b = b < 0.040448236277105097 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

		// Applying linear transformation using RGB to XYZ transformation matrix.
		const x = r * 41.24564390896921145 + g * 35.75760776439090507 + b * 18.04374830853290341;
		const y = r * 21.26728514056222474 + g * 71.51521552878181013 + b * 7.21749933075596513;
		const z = r * 1.93338955823293176 + g * 11.91919550818385936 + b * 95.03040770337479886;

		return [x, y, z]
	},

	xyzToLab: function ([x, y, z]) {
		colorUtilities.assertArrayColor([x, y, z]);

		// Reference white point : D65 2° Standard observer
		const refX = 95.047;
		const refY = 100.000;
		const refZ = 108.883;

		x /= refX;
		y /= refY;
		z /= refZ;

		// Applying the CIE standard transformation.
		x = x < 216.0 / 24389.0 ? ((841.0 / 108.0) * x) + (4.0 / 29.0) : Math.cbrt(x);
		y = y < 216.0 / 24389.0 ? ((841.0 / 108.0) * y) + (4.0 / 29.0) : Math.cbrt(y);
		z = z < 216.0 / 24389.0 ? ((841.0 / 108.0) * z) + (4.0 / 29.0) : Math.cbrt(z);

		const l = (116.0 * y) - 16.0;
		const a = 500.0 * (x - y);
		const b = 200.0 * (y - z);

		return [l, a, b];
	},

	rgbToLab: function ([r, g, b]) { // r, g, b entre 0 y 1
		colorUtilities.assertArrayColor([r, g, b]);

		return colorUtilities.xyzToLab(colorUtilities.rgbToXyz([r, g, b]));
	},

	labToXyz: function ([l, a, b]) {
		colorUtilities.assertArrayColor([l, a, b]);

		// Reference white point : D65 2° Standard observer
		const refX = 95.047;
		const refY = 100.000;
		const refZ = 108.883;

		var y = (l + 16.0) / 116.0;
		var x = a / 500.0 + y;
		var z = y - b / 200.0;

		const x3 = x ** 3;
		const z3 = z ** 3;

		x = x3 < 216.0 / 24389.0 ? (x - 4.0 / 29.0) / (841.0 / 108.0) : x3;
		y = l < 8.0 ? l / (24389.0 / 27.0) : y ** 3;
		z = z3 < 216.0 / 24389.0 ? (z - 4.0 / 29.0) / (841.0 / 108.0) : z3;

		return [x * refX, y * refY, z * refZ];
	},

	xyzToRgb: function ([x, y, z]) {
		colorUtilities.assertArrayColor([x, y, z]);

		// Applying linear transformation using the XYZ to RGB transformation matrix.
		var r = x * 0.032404541621141049051 + y * -0.015371385127977165753 + z * -0.004985314095560160079;
		var g = x * -0.009692660305051867686 + y * 0.018760108454466942288 + z * 0.00041556017530349983;
		var b = x * 0.000556434309591145522 + y * -0.002040259135167538416 + z * 0.010572251882231790398;

		// Apply gamma correction.
		r = r < 0.003130668442500634 ? 12.92 * r : 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055;
		g = g < 0.003130668442500634 ? 12.92 * g : 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055;
		b = b < 0.003130668442500634 ? 12.92 * b : 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055;

		return [r, g, b]; // r, g, b entre 0 y 1
	},

	// rgb en 0..1
	labToRgb: function ([l, a, b]) {
		colorUtilities.assertArrayColor([l, a, b]);

		return colorUtilities.xyzToRgb(colorUtilities.labToXyz([l, a, b]));
	},

    goldenAngleStartingHue: 0.0,
	goldenAngleDefaultSaturation: 0.8,
	goldenAngleDefaultLightness: 0.5,

	goldenAngleColorGenerator: function* (hue, saturation, lightness) {
        let currentHue = hue;
		const goldenAngle = (3 - Math.sqrt(5)) / 2; // Ángulo áureo en partes de giro completo
		while (true) {
			const [r, g, b] = colorUtilities.hslToRgb([currentHue % 1, saturation, lightness]);
			currentHue += goldenAngle;
			yield colorUtilities.rgbToHex(colorUtilities.rgb1ToRgb255([r, g, b])); // Genera un color en formato hexadecimal
		}
	},

	// GitHub Project : https://github.com/michel-leonard/ciede2000-color-matching
	cieDeltaE2000: function ([l1, a1, b1], [l2, a2, b2]) {
		colorUtilities.assertArrayColor([l1, a1, b1]);
		colorUtilities.assertArrayColor([l2, a2, b2]);

		// Working in JavaScript with the CIEDE2000 color-difference formula.
		// kl, kc, kh are parametric factors to be adjusted according to
		// different viewing parameters such as textures, backgrounds...
		const kl = 1.0,
			kc = 1.0,
			kh = 1.0;
		let n = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) * 0.5;
		n = n ** 7;
		// A factor involving chroma raised to the power of 7 designed to make
		// the influence of chroma on the total color difference more accurate.
		n = 1.0 + 0.5 * (1.0 - Math.sqrt(n / (n + 6103515625.0)));
		// Application of the chroma correction factor.
		const c1 = Math.hypot(a1 * n, b1);
		const c2 = Math.hypot(a2 * n, b2);
		// atan2 is preferred over atan because it accurately computes the angle of
		// a point (x, y) in all quadrants, handling the signs of both coordinates.
		let h1 = Math.atan2(b1, a1 * n),
			h2 = Math.atan2(b2, a2 * n);
		h1 += 2.0 * Math.PI * (h1 < 0.0);
		h2 += 2.0 * Math.PI * (h2 < 0.0);
		n = Math.abs(h2 - h1);
		// Cross-implementation consistent rounding.
		if (Math.PI - 1E-14 < n && n < Math.PI + 1E-14) n = Math.PI;
		// When the hue angles lie in different quadrants, the straightforward
		// average can produce a mean that incorrectly suggests a hue angle in
		// the wrong quadrant, the next lines handle this issue.
		let hm = (h1 + h2) * 0.5,
			hd = (h2 - h1) * 0.5;
		if (Math.PI < n) {
			hd += Math.PI;
			// 📜 Sharma’s formulation doesn’t use the next line, but the one after it,
			// and these two variants differ by ±0.0003 on the final color differences.
			hm += Math.PI;
			// hm += hm < Math.PI ? Math.PI : -Math.PI;
		}
		const p = 36.0 * hm - 55.0 * Math.PI;
		n = (c1 + c2) * 0.5;
		n = n ** 7;
		// The hue rotation correction term is designed to account for the
		// non-linear behavior of hue differences in the blue region.
		const rt = -2.0 * Math.sqrt(n / (n + 6103515625.0))
			* Math.sin(Math.PI / 3.0 * Math.exp(p * p / (-25.0 * Math.PI * Math.PI)));
		n = (l1 + l2) * 0.5;
		n = (n - 50.0) ** 2;
		// Lightness.
		const l = (l2 - l1) / (kl * (1.0 + 0.015 * n / Math.sqrt(20.0 + n)));
		// These coefficients adjust the impact of different harmonic
		// components on the hue difference calculation.
		const t = 1.0 + 0.24 * Math.sin(2.0 * hm + Math.PI * 0.5)
			+ 0.32 * Math.sin(3.0 * hm + 8.0 * Math.PI / 15.0)
			- 0.17 * Math.sin(hm + Math.PI / 3.0)
			- 0.20 * Math.sin(4.0 * hm + 3.0 * Math.PI / 20.0);
		n = c1 + c2;
		// Hue.
		const h = 2.0 * Math.sqrt(c1 * c2) * Math.sin(hd) / (kh * (1.0 + 0.0075 * n * t));
		// Chroma.
		const c = (c2 - c1) / (kc * (1.0 + 0.0225 * n));
		// Returning the square root ensures that dE00 accurately reflects the
		// geometric distance in color space, which can range from 0 to around 185.
		return Math.sqrt(l * l + h * h + c * c + c * h * rt);
	},

    mimimumCieDeltaE2000: 8, // Diferencia mínima admisible entre dos colores

	getDistance: function (rgb1, rgb2) { // r, g, b entre 0 y 1
        return colorUtilities.cieDeltaE2000(colorUtilities.rgbToLab(rgb1), colorUtilities.rgbToLab(rgb2));
	},

	rgb1ToRgb255: function ([r, g, b]) { // r, g, b entre 0 y 1
		colorUtilities.assertArrayColor([r, g, b]);

		return [r, g, b].map((value) => Math.round(value * 255));
	},

	rgb255ToRgb1: function ([r, g, b]) { // r, g, b entre 0 y 255
		colorUtilities.assertArrayColor([r, g, b]);

		return [r, g, b].map((value) => value / 255);
	},

	assertArrayColor: function (color) {
		if (!Array.isArray(color) || (color.length < 3)) {
			throw new Error(`Color ${color} must be an array with three components`);
		}
		if (color.some(c => typeof c !== 'number' || isNaN(c))) {
			throw new Error(`Color components in ${color} must be numbers`);
        }
	},

	assertHexColor: function (color) {
		if (typeof color !== 'string' || !/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
			throw new Error(`Color ${color} must be a hex string like "#RRGGBB" or "#RGB"`);
		}
	},
};

colorUtilities.goldenAngleColor = colorUtilities.goldenAngleColorGenerator(
	colorUtilities.goldenAngleStartingHue,
	colorUtilities.goldenAngleDefaultSaturation,
    colorUtilities.goldenAngleDefaultLightness
);

export default colorUtilities;