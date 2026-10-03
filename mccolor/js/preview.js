/* preview.js — 预览渲染、§k 动画、可读性检查 */
(function (root) {
  'use strict';

  var C = root.MCColor, G = root.MCGradient, S = G.S;
  var I18N = root.I18N;

  var P = { host: null, inner: null, contrastEl: null, timer: null };

  var BG_RGB = {
    chat: '#101215', grass: '#5F9640', stone: '#808080', obsidian: '#1A1229',
    sand: '#E0D097', nether: '#691F1F', white: '#F8F8F8'
  };

  var OBF_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*?';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  P.mount = function (host, inner, contrastEl) {
    P.host = host; P.inner = inner; P.contrastEl = contrastEl;
  };

  /* 对比度检查用的代表色；图片背景用上传时算好的平均色 */
  P.bgColor = function (prefs) {
    if (prefs.bg === 'custom') return prefs.bgColor || '#2B2B2B';
    if (prefs.bg === 'image') return prefs.bgAvg || '#7A7A7A';
    return BG_RGB[prefs.bg] || '#101215';
  };

  P.render = function (b, state, prefs) {
    P.host.dataset.bg = prefs.bg;
    P.host.style.backgroundColor = '';
    P.host.style.backgroundImage = '';
    if (prefs.bg === 'custom') P.host.style.backgroundColor = prefs.bgColor;
    else if (prefs.bg === 'image' && prefs.bgImage) {
      P.host.style.backgroundImage = 'url("' + prefs.bgImage + '")';
    }
    P.host.classList.toggle('shadow', !!prefs.shadow);
    P.inner.style.fontSize = prefs.scale + 'px';

    var html = '', lastHex = '#FFFFFF';
    b.segments.forEach(function (sg) {
      if (sg.newline) { html += '<br>'; return; }
      var hex = sg.hex || lastHex;
      lastHex = hex;
      var cls = [];
      if (sg.style & S.BOLD)   cls.push('mc-b');
      if (sg.style & S.ITALIC) cls.push('mc-i');
      if (sg.style & S.UNDER)  cls.push('mc-u');
      if (sg.style & S.STRIKE) cls.push('mc-s');
      var sh = C.toHex(C.shadowOf(C.parseHex(hex)));
      var obf = (sg.style & S.OBF) ? ' data-obf="1"' : '';
      html += '<span class="' + cls.join(' ') + '" style="color:' + hex + ';--sh:' + sh + '"' + obf + '>' +
        esc(sg.text) + '</span>';
    });
    P.inner.innerHTML = html || '<span style="opacity:.4">…</span>';

    startObf(prefs.animObf);
    renderContrast(b, state, prefs);
  };

  /* ---------- §k 动画 ---------- */
  function startObf(enabled) {
    if (P.timer) { clearInterval(P.timer); P.timer = null; }
    var nodes = P.inner.querySelectorAll('[data-obf]');
    if (!nodes.length) return;
    nodes.forEach(function (n) { if (!n.dataset.orig) n.dataset.orig = n.textContent; });
    if (!enabled) {
      nodes.forEach(function (n) { n.textContent = n.dataset.orig; });
      return;
    }
    P.timer = setInterval(function () {
      P.inner.querySelectorAll('[data-obf]').forEach(function (n) {
        var len = (n.dataset.orig || '').length, s = '';
        for (var i = 0; i < len; i++) s += OBF_POOL[(Math.random() * OBF_POOL.length) | 0];
        n.textContent = s;
      });
    }, 55);
  }

  /* ---------- 可读性 ---------- */
  function renderContrast(b, state, prefs) {
    if (!P.contrastEl) return;
    var bg = C.parseHex(P.bgColor(prefs));
    var worst = Infinity, low = 0, seen = Object.create(null);

    for (var i = 0; i < b.chars.length; i++) {
      var hx = b.colors[i];
      if (!hx || b.chars[i] === '\n' || b.chars[i] === ' ') continue;
      if (seen[hx]) continue;
      var r = C.contrast(C.parseHex(hx), bg);
      seen[hx] = true;
      if (r < worst) worst = r;
      if (r < 3) low++;
    }
    if (worst === Infinity) { P.contrastEl.innerHTML = ''; return; }

    var level = worst >= 4.5 ? 'good' : (worst >= 3 ? 'ok' : 'low');
    var cls = level === 'low' ? 'chip bad' : (level === 'good' ? 'chip ok' : 'chip');
    P.contrastEl.innerHTML =
      '<span class="' + cls + '">' + I18N.t('contrast.label') + '：<b>' +
      I18N.t('contrast.' + level) + '</b></span>' +
      '<span class="chip">' + I18N.t('contrast.worst', worst.toFixed(2)) + '</span>' +
      (low ? '<span class="chip bad">' + low + ' <span>' +
        (I18N.getLang() === 'zh' ? '种颜色偏暗' : 'colours too dim') + '</span></span>' : '');
  }

  root.MCPreview = P;
})(window);
