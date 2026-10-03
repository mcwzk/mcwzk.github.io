/* gradient.js — 渐变引擎：把状态编译成「色段」 */
(function (root) {
  'use strict';

  var C = root.MCColor, E = root.MCEase;
  var G = {};

  /* 样式位 */
  var S = { BOLD: 1, ITALIC: 2, UNDER: 4, STRIKE: 8, OBF: 16 };
  G.S = S;
  G.STYLE_KEYS = { bold: S.BOLD, italic: S.ITALIC, underline: S.UNDER, strike: S.STRIKE, obf: S.OBF };

  /* ---------- 采样 ---------- */
  function normStops(stops) {
    var arr = stops.map(function (s) {
      return { rgb: C.parseHex(s.color) || [255, 255, 255], pos: C.clamp01(s.pos) };
    });
    arr.sort(function (a, b) { return a.pos - b.pos; });
    return arr;
  }

  G.sample = function (ns, t, space, hueDir) {
    var n = ns.length;
    if (!n) return [255, 255, 255];
    if (n === 1) return ns[0].rgb.slice();
    if (t <= ns[0].pos) return ns[0].rgb.slice();
    if (t >= ns[n - 1].pos) return ns[n - 1].rgb.slice();

    var i = 0;
    while (i < n - 2 && t > ns[i + 1].pos) i++;
    var p0 = ns[i].pos, p1 = ns[i + 1].pos;
    var local = (p1 - p0) < 1e-9 ? 0 : (t - p0) / (p1 - p0);

    if (space === 'catmull') {
      return C.catmullSample(ns.map(function (s) { return s.rgb; }), i, local);
    }
    return C.mix(ns[i].rgb, ns[i + 1].rgb, local, space, hueDir);
  };

  /* 供渐变条 / 预设缩略图使用的 CSS 渐变字符串 */
  G.toCss = function (stops, space, hueDir, steps) {
    var ns = normStops(stops);
    if (!ns.length) return 'transparent';
    if (ns.length === 1) return C.toHex(ns[0].rgb);
    steps = steps || 40;
    var parts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      parts.push(C.toHex(G.sample(ns, t, space, hueDir)) + ' ' + (t * 100).toFixed(2) + '%');
    }
    return 'linear-gradient(90deg,' + parts.join(',') + ')';
  };

  /* ---------- 分组 ---------- */
  function isWs(ch) { return ch === ' ' || ch === '\t' || ch === '　'; }

  function assignGroups(indices, chars, st) {
    var groupOf = Object.create(null);
    var groups = 0, k, i, ws;

    if (st.unit === 'word') {
      var inWord = false;
      for (k = 0; k < indices.length; k++) {
        i = indices[k]; ws = isWs(chars[i]);
        if (ws) {
          groupOf[i] = st.skipSpaces ? -1 : Math.max(0, groups - 1);
          inWord = false;
        } else {
          if (!inWord) { groups++; inWord = true; }
          groupOf[i] = groups - 1;
        }
      }
    } else {
      var n = 0, gran = Math.max(1, st.gran | 0 || 1);
      for (k = 0; k < indices.length; k++) {
        i = indices[k]; ws = isWs(chars[i]);
        if (ws && st.skipSpaces) { groupOf[i] = -1; continue; }
        groupOf[i] = Math.floor(n / gran);
        n++;
      }
      groups = Math.ceil(n / gran);
    }
    return { of: groupOf, count: groups };
  }

  /* ---------- 主编译 ---------- */
  /**
   * 返回 { chars, colors, segments, lines, stats }
   * segments: [{ text, hex|null, style, newline }]
   */
  G.build = function (st) {
    var chars = Array.from(st.text || '');
    var mask = st.styleMask || [];
    var ns = normStops(st.stops || []);
    var space = st.space || 'oklab';
    var hueDir = st.hueDir || 'short';

    /* 按行拆索引 */
    var lines = [], cur = [];
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] === '\n') { lines.push(cur); cur = []; }
      else cur.push(i);
    }
    lines.push(cur);

    var colorHex = new Array(chars.length);   /* 每个字符的颜色（null = 不着色） */
    var perLine = st.lines === 'perline' || st.lines === 'shift';
    var quant = Math.max(0, st.quantize | 0);

    function colorFor(tRaw, extraOffset) {
      var t = E.transform(tRaw, {
        offset: (st.offset || 0) + (extraOffset || 0),
        loop: st.loop || 'once',
        repeats: st.repeats || 1
      });
      t = E.apply(st.easing || 'linear', t);
      if (quant >= 2) t = Math.round(t * (quant - 1)) / (quant - 1);
      return C.toHex(G.sample(ns, t, space, hueDir));
    }

    if (perLine) {
      for (var li = 0; li < lines.length; li++) {
        var idx = lines[li];
        var gr = assignGroups(idx, chars, st);
        var extra = st.lines === 'shift' ? li * ((st.lineShift || 0) / 100) : 0;
        for (var q = 0; q < idx.length; q++) {
          var ci = idx[q], gid = gr.of[ci];
          if (gid < 0) { colorHex[ci] = null; continue; }
          var tt = gr.count > 1 ? gid / (gr.count - 1) : 0;
          colorHex[ci] = colorFor(tt, extra);
        }
      }
    } else {
      var all = [];
      for (var l2 = 0; l2 < lines.length; l2++) all = all.concat(lines[l2]);
      var gAll = assignGroups(all, chars, st);
      for (var w = 0; w < all.length; w++) {
        var ai = all[w], ag = gAll.of[ai];
        if (ag < 0) { colorHex[ai] = null; continue; }
        var t2 = gAll.count > 1 ? ag / (gAll.count - 1) : 0;
        colorHex[ai] = colorFor(t2, 0);
      }
    }

    /* 逐字精修：单独指定的颜色覆盖渐变算出来的颜色 */
    var ov = st.colorOverride || [];
    for (var v = 0; v < chars.length; v++) {
      if (ov[v] && chars[v] !== '\n') colorHex[v] = ov[v];
    }

    /* 未着色字符若样式与前一个不同，强制补上颜色码，否则样式无法生效 */
    var lastColor = null;
    for (var p = 0; p < chars.length; p++) {
      if (chars[p] === '\n') { lastColor = null; continue; }
      if (colorHex[p] === null) {
        var prevMask = p > 0 && chars[p - 1] !== '\n' ? (mask[p - 1] | 0) : 0;
        if ((mask[p] | 0) !== prevMask && lastColor) colorHex[p] = lastColor;
      } else {
        lastColor = colorHex[p];
      }
    }

    /* ---------- 合成色段 ---------- */
    var segs = [];
    var compress = st.compress !== false;
    var lastGid = null;
    var gidMap = null;

    /* 重新算一遍 group id，用于「不压缩」时的切段 */
    if (!compress) {
      gidMap = new Array(chars.length);
      if (perLine) {
        for (var m = 0, base = 0; m < lines.length; m++) {
          var gr2 = assignGroups(lines[m], chars, st);
          for (var z = 0; z < lines[m].length; z++) {
            var zi = lines[m][z];
            gidMap[zi] = gr2.of[zi] < 0 ? -1 : base + gr2.of[zi];
          }
          base += gr2.count;
        }
      } else {
        var allB = [];
        for (var b2 = 0; b2 < lines.length; b2++) allB = allB.concat(lines[b2]);
        var grB = assignGroups(allB, chars, st);
        for (var y = 0; y < allB.length; y++) gidMap[allB[y]] = grB.of[allB[y]];
      }
    }

    for (var c2 = 0; c2 < chars.length; c2++) {
      var ch = chars[c2];
      if (ch === '\n') { segs.push({ newline: true, text: '\n', hex: null, style: 0 }); lastGid = null; continue; }
      var hx = colorHex[c2] === undefined ? null : colorHex[c2];
      var sm = mask[c2] | 0;
      var gid2 = compress ? null : gidMap[c2];
      var prev = segs.length ? segs[segs.length - 1] : null;
      var sameGroup = compress ? true : (gid2 === lastGid && gid2 !== -1);

      if (prev && !prev.newline && prev.hex === hx && prev.style === sm && sameGroup) {
        prev.text += ch;
      } else {
        segs.push({ text: ch, hex: hx, style: sm, newline: false });
      }
      lastGid = gid2;
    }

    /* ---------- 统计 ---------- */
    var uniq = Object.create(null), nColors = 0;
    for (var u = 0; u < chars.length; u++) {
      if (colorHex[u]) { if (!uniq[colorHex[u]]) { uniq[colorHex[u]] = 1; nColors++; } }
    }

    return {
      chars: chars,
      colors: colorHex,
      segments: segs,
      lineCount: lines.length,
      stats: {
        chars: chars.length,
        visible: chars.filter(function (c) { return c !== '\n'; }).length,
        colors: nColors,
        segments: segs.filter(function (s) { return !s.newline; }).length,
        lines: lines.length
      }
    };
  };

  root.MCGradient = G;
})(window);
