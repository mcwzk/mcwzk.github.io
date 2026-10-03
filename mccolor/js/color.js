/* color.js — 色彩空间转换、插值、Minecraft 调色板、对比度 */
(function (root) {
  'use strict';

  var C = {};

  /* ---------- 基础 ---------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function clamp01(v) { return clamp(v, 0, 1); }
  C.clamp = clamp; C.clamp01 = clamp01;

  C.parseHex = function (str) {
    if (typeof str !== 'string') return null;
    var s = str.trim().replace(/^[#&]+/, '').replace(/^x/i, '');
    if (/^[0-9a-f]{3}$/i.test(s)) {
      s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    }
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16)
    ];
  };

  C.toHex = function (rgb) {
    var s = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(clamp(rgb[i], 0, 255));
      s += (v < 16 ? '0' : '') + v.toString(16);
    }
    return s.toUpperCase();
  };

  C.isHex = function (s) { return C.parseHex(s) !== null; };

  /* ---------- sRGB <-> 线性 ---------- */
  function srgbToLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function linToSrgb(c) {
    var v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return clamp(v * 255, 0, 255);
  }
  C.srgbToLin = srgbToLin; C.linToSrgb = linToSrgb;

  /* ---------- HSL ---------- */
  C.rgbToHsl = function (rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2, d = max - min;
    if (d > 1e-9) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };

  C.hslToRgb = function (hsl) {
    var h = ((hsl[0] % 360) + 360) % 360, s = clamp01(hsl[1]), l = clamp01(hsl[2]);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2, r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };

  /* ---------- HSV ---------- */
  C.rgbToHsv = function (rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0;
    if (d > 1e-9) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, max === 0 ? 0 : d / max, max];
  };

  C.hsvToRgb = function (hsv) {
    var h = ((hsv[0] % 360) + 360) % 360, s = clamp01(hsv[1]), v = clamp01(hsv[2]);
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  };

  /* ---------- CIE Lab (D65) ---------- */
  var Xn = 0.95047, Yn = 1.0, Zn = 1.08883;
  var EPS = 216 / 24389, KAP = 24389 / 27;

  C.rgbToLab = function (rgb) {
    var r = srgbToLin(rgb[0]), g = srgbToLin(rgb[1]), b = srgbToLin(rgb[2]);
    var X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / Xn;
    var Y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / Yn;
    var Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / Zn;
    function f(t) { return t > EPS ? Math.cbrt(t) : (KAP * t + 16) / 116; }
    var fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };

  C.labToRgb = function (lab) {
    var fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200;
    function fi(t) { var t3 = t * t * t; return t3 > EPS ? t3 : (116 * t - 16) / KAP; }
    var X = fi(fx) * Xn;
    var Y = (lab[0] > KAP * EPS ? Math.pow((lab[0] + 16) / 116, 3) : lab[0] / KAP) * Yn;
    var Z = fi(fz) * Zn;
    var r =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
    var g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
    var b =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
    return [linToSrgb(r), linToSrgb(g), linToSrgb(b)];
  };

  /* ---------- OKLab ---------- */
  C.rgbToOklab = function (rgb) {
    var r = srgbToLin(rgb[0]), g = srgbToLin(rgb[1]), b = srgbToLin(rgb[2]);
    var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
    var l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return [
      0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    ];
  };

  C.oklabToRgb = function (lab) {
    var l_ = lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2];
    var m_ = lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2];
    var s_ = lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2];
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [
      linToSrgb( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      linToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      linToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    ];
  };

  /* ---------- 色相插值方向 ---------- */
  function lerpHue(a, b, t, dir) {
    var d = b - a;
    if (dir === 'cw') { while (d < 0) d += 360; }
    else if (dir === 'ccw') { while (d > 0) d -= 360; }
    else if (dir === 'long') {
      d = ((d % 360) + 360) % 360;
      if (d < 180) d -= 360;
    } else { /* short */
      d = ((d % 360) + 360) % 360;
      if (d > 180) d -= 360;
    }
    return a + d * t;
  }
  C.lerpHue = lerpHue;

  /* ---------- 两色混合 ---------- */
  C.mix = function (c1, c2, t, space, hueDir) {
    t = clamp01(t);
    switch (space) {
      case 'rgb':
        return [
          c1[0] + (c2[0] - c1[0]) * t,
          c1[1] + (c2[1] - c1[1]) * t,
          c1[2] + (c2[2] - c1[2]) * t
        ];
      case 'srgb-linear': {
        var a = [srgbToLin(c1[0]), srgbToLin(c1[1]), srgbToLin(c1[2])];
        var b = [srgbToLin(c2[0]), srgbToLin(c2[1]), srgbToLin(c2[2])];
        return [
          linToSrgb(a[0] + (b[0] - a[0]) * t),
          linToSrgb(a[1] + (b[1] - a[1]) * t),
          linToSrgb(a[2] + (b[2] - a[2]) * t)
        ];
      }
      case 'hsl': {
        var h1 = C.rgbToHsl(c1), h2 = C.rgbToHsl(c2);
        var hs1 = h1[1] < 1e-6 ? h2[0] : h1[0];
        var hs2 = h2[1] < 1e-6 ? h1[0] : h2[0];
        return C.hslToRgb([
          lerpHue(hs1, hs2, t, hueDir),
          h1[1] + (h2[1] - h1[1]) * t,
          h1[2] + (h2[2] - h1[2]) * t
        ]);
      }
      case 'hsv': {
        var v1 = C.rgbToHsv(c1), v2 = C.rgbToHsv(c2);
        var vs1 = v1[1] < 1e-6 ? v2[0] : v1[0];
        var vs2 = v2[1] < 1e-6 ? v1[0] : v2[0];
        return C.hsvToRgb([
          lerpHue(vs1, vs2, t, hueDir),
          v1[1] + (v2[1] - v1[1]) * t,
          v1[2] + (v2[2] - v1[2]) * t
        ]);
      }
      case 'lab': {
        var l1 = C.rgbToLab(c1), l2 = C.rgbToLab(c2);
        return C.labToRgb([
          l1[0] + (l2[0] - l1[0]) * t,
          l1[1] + (l2[1] - l1[1]) * t,
          l1[2] + (l2[2] - l1[2]) * t
        ]);
      }
      case 'oklab':
      default: {
        var o1 = C.rgbToOklab(c1), o2 = C.rgbToOklab(c2);
        return C.oklabToRgb([
          o1[0] + (o2[0] - o1[0]) * t,
          o1[1] + (o2[1] - o1[1]) * t,
          o1[2] + (o2[2] - o1[2]) * t
        ]);
      }
    }
  };

  /* ---------- Catmull-Rom（在 OKLab 里做样条，避免灰化） ---------- */
  function catmull(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  C.catmullSample = function (stopsRgb, seg, t) {
    var n = stopsRgb.length;
    var i0 = Math.max(0, seg - 1), i1 = seg, i2 = Math.min(n - 1, seg + 1), i3 = Math.min(n - 1, seg + 2);
    var a = C.rgbToOklab(stopsRgb[i0]), b = C.rgbToOklab(stopsRgb[i1]);
    var c = C.rgbToOklab(stopsRgb[i2]), d = C.rgbToOklab(stopsRgb[i3]);
    return C.oklabToRgb([
      catmull(a[0], b[0], c[0], d[0], t),
      catmull(a[1], b[1], c[1], d[1], t),
      catmull(a[2], b[2], c[2], d[2], t)
    ]);
  };

  /* ---------- Minecraft 原版 16 色 ---------- */
  C.MC_COLORS = [
    { code: '0', name: 'black',        hex: '#000000', bedrock: true },
    { code: '1', name: 'dark_blue',    hex: '#0000AA', bedrock: true },
    { code: '2', name: 'dark_green',   hex: '#00AA00', bedrock: true },
    { code: '3', name: 'dark_aqua',    hex: '#00AAAA', bedrock: true },
    { code: '4', name: 'dark_red',     hex: '#AA0000', bedrock: true },
    { code: '5', name: 'dark_purple',  hex: '#AA00AA', bedrock: true },
    { code: '6', name: 'gold',         hex: '#FFAA00', bedrock: true },
    { code: '7', name: 'gray',         hex: '#AAAAAA', bedrock: true },
    { code: '8', name: 'dark_gray',    hex: '#555555', bedrock: true },
    { code: '9', name: 'blue',         hex: '#5555FF', bedrock: true },
    { code: 'a', name: 'green',        hex: '#55FF55', bedrock: true },
    { code: 'b', name: 'aqua',         hex: '#55FFFF', bedrock: true },
    { code: 'c', name: 'red',          hex: '#FF5555', bedrock: true },
    { code: 'd', name: 'light_purple', hex: '#FF55FF', bedrock: true },
    { code: 'e', name: 'yellow',       hex: '#FFFF55', bedrock: true },
    { code: 'f', name: 'white',        hex: '#FFFFFF', bedrock: true },
    /* 基岩版专有 */
    { code: 'g', name: 'minecoin_gold', hex: '#DDD605', bedrock: true, javaOnly: false, bedrockOnly: true },
    { code: 'h', name: 'material_quartz',    hex: '#E3D4D1', bedrockOnly: true },
    { code: 'i', name: 'material_iron',      hex: '#CECACA', bedrockOnly: true },
    { code: 'j', name: 'material_netherite', hex: '#443A3B', bedrockOnly: true },
    { code: 'm', name: 'material_redstone',  hex: '#971607', bedrockOnly: true },
    { code: 'n', name: 'material_copper',    hex: '#B4684D', bedrockOnly: true },
    { code: 'p', name: 'material_gold',      hex: '#DEB12D', bedrockOnly: true },
    { code: 'q', name: 'material_emerald',   hex: '#47A036', bedrockOnly: true },
    { code: 's', name: 'material_diamond',   hex: '#2CBAA8', bedrockOnly: true },
    { code: 't', name: 'material_lapis',     hex: '#21497B', bedrockOnly: true },
    { code: 'u', name: 'material_amethyst',  hex: '#9A5CC6', bedrockOnly: true }
  ];

  var JAVA16 = C.MC_COLORS.slice(0, 16);
  var BEDROCK_ALL = C.MC_COLORS;   /* 基岩版 16 色 + 材质色 */

  /* 用 OKLab 距离找最接近的原版颜色 —— 比 RGB 欧氏距离准得多 */
  function nearestFrom(list, rgb) {
    var target = C.rgbToOklab(rgb);
    var best = list[0], bestD = Infinity;
    for (var i = 0; i < list.length; i++) {
      if (!list[i]._ok) list[i]._ok = C.rgbToOklab(C.parseHex(list[i].hex));
      var o = list[i]._ok;
      var dl = (o[0] - target[0]) * 1.6, da = o[1] - target[1], db = o[2] - target[2];
      var d = dl * dl + da * da + db * db;
      if (d < bestD) { bestD = d; best = list[i]; }
    }
    return best;
  }
  C.nearestLegacy = function (rgb) { return nearestFrom(JAVA16, rgb); };
  C.nearestBedrock = function (rgb) { return nearestFrom(BEDROCK_ALL, rgb); };

  /* ---------- Minecraft 文字阴影：(c & 0xFCFCFC) >> 2 ---------- */
  C.shadowOf = function (rgb) {
    return [
      (Math.round(rgb[0]) & 0xFC) >> 2,
      (Math.round(rgb[1]) & 0xFC) >> 2,
      (Math.round(rgb[2]) & 0xFC) >> 2
    ];
  };

  /* ---------- WCAG 相对亮度 / 对比度 ---------- */
  C.luminance = function (rgb) {
    return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]);
  };
  C.contrast = function (a, b) {
    var l1 = C.luminance(a), l2 = C.luminance(b);
    if (l1 < l2) { var tmp = l1; l1 = l2; l2 = tmp; }
    return (l1 + 0.05) / (l2 + 0.05);
  };

  /* ---------- 随机配色（色彩理论） ---------- */
  C.randomPalette = function (scheme, count) {
    var baseH = Math.random() * 360;
    var s = 0.55 + Math.random() * 0.4;
    var l = 0.45 + Math.random() * 0.18;
    var offs;
    switch (scheme) {
      case 'complement':  offs = [0, 180]; break;
      case 'triad':       offs = [0, 120, 240]; break;
      case 'analogous':   offs = [-40, -15, 10, 35]; break;
      case 'split':       offs = [0, 150, 210]; break;
      case 'tetrad':      offs = [0, 90, 180, 270]; break;
      default:            offs = [0, 30, 60]; break;
    }
    var n = count || offs.length;
    var out = [];
    for (var i = 0; i < n; i++) {
      var o = offs[i % offs.length] + (i >= offs.length ? 18 * Math.floor(i / offs.length) : 0);
      out.push(C.toHex(C.hslToRgb([
        baseH + o,
        clamp01(s + (Math.random() - 0.5) * 0.18),
        clamp01(l + (Math.random() - 0.5) * 0.22)
      ])));
    }
    return out;
  };

  /* ---------- 从图片提取主色（中位切分量化 + 按色相排序） ---------- */
  C.extractFromImage = function (img, k) {
    k = k || 5;
    var W = 120, H = Math.max(1, Math.round(W * img.height / img.width)) || 120;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    var data;
    try { data = ctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }

    var px = [];
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 125) continue;
      px.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (!px.length) return null;

    function box(list) {
      var mn = [255, 255, 255], mx = [0, 0, 0];
      for (var i = 0; i < list.length; i++) for (var c = 0; c < 3; c++) {
        if (list[i][c] < mn[c]) mn[c] = list[i][c];
        if (list[i][c] > mx[c]) mx[c] = list[i][c];
      }
      return { list: list, range: Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]),
               ch: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]].indexOf(
                   Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2])) };
    }

    var boxes = [box(px)];
    while (boxes.length < k) {
      boxes.sort(function (a, b) { return b.range * b.list.length - a.range * a.list.length; });
      var big = boxes.shift();
      if (!big || big.list.length < 2) { if (big) boxes.push(big); break; }
      var ch = big.ch;
      big.list.sort(function (a, b) { return a[ch] - b[ch]; });
      var mid = big.list.length >> 1;
      boxes.push(box(big.list.slice(0, mid)));
      boxes.push(box(big.list.slice(mid)));
    }

    var cols = boxes.map(function (b) {
      var s = [0, 0, 0];
      for (var i = 0; i < b.list.length; i++) { s[0] += b.list[i][0]; s[1] += b.list[i][1]; s[2] += b.list[i][2]; }
      var n = b.list.length;
      return [s[0] / n, s[1] / n, s[2] / n];
    });

    /* 按亮度排序，渐变才顺 */
    cols.sort(function (a, b) { return C.luminance(a) - C.luminance(b); });
    return cols.map(C.toHex);
  };

  root.MCColor = C;
})(window);
