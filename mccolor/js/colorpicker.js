/* colorpicker.js — 自定义取色器弹层
   浏览器原生 <input type="color"> 的弹窗位置不受控（Chrome 经常甩到屏幕角落），
   样式也没法跟站点统一，所以这里自己实现一个。 */
(function (root) {
  'use strict';

  var C = root.MCColor;
  var I18N = root.I18N;

  var P = {
    el: null, anchor: null, onChange: null,
    h: 0, s: 1, v: 1,
    open: false,
    drag: null
  };

  var TXT = {
    zh: { hex: 'HEX', mc: 'Minecraft 原版 16 色', recent: '最近使用', eyedrop: '屏幕吸管',
          mode: '切换 RGB / HSL', none: '（还没有用过的颜色）' },
    en: { hex: 'HEX', mc: 'Minecraft legacy 16', recent: 'Recent', eyedrop: 'Screen picker',
          mode: 'Switch RGB / HSL', none: '(no colours used yet)' }
  };
  function t(k) { return (TXT[I18N.getLang()] || TXT.zh)[k]; }

  var mode = 'rgb';   /* rgb | hsl */

  /* ---------- 最近使用的颜色 ---------- */
  var LS_RECENT = 'mcgrad.recent.v1';
  function getRecent() {
    try { var a = JSON.parse(localStorage.getItem(LS_RECENT)); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function pushRecent(hex) {
    var list = getRecent().filter(function (c) { return c !== hex; });
    list.unshift(hex);
    list = list.slice(0, 14);
    try { localStorage.setItem(LS_RECENT, JSON.stringify(list)); } catch (e) {}
  }

  /* ---------- 构建 DOM ---------- */
  function build() {
    var d = document.createElement('div');
    d.className = 'cp-pop';
    d.innerHTML =
      '<div class="cp-sv" tabindex="0"><span class="cp-sv-dot"></span></div>' +
      '<div class="cp-mid">' +
        '<span class="cp-chip"></span>' +
        '<div class="cp-hue"><span class="cp-hue-dot"></span></div>' +
        '<button class="cp-icon cp-eye" type="button" title="' + t('eyedrop') + '">⊙</button>' +
      '</div>' +
      '<div class="cp-fields">' +
        '<label class="cp-f cp-f-hex"><span>' + t('hex') + '</span>' +
          '<input class="cp-hex mono" spellcheck="false" maxlength="7"></label>' +
        '<label class="cp-f"><span class="cp-l0"></span><input class="cp-n cp-n0" type="number"></label>' +
        '<label class="cp-f"><span class="cp-l1"></span><input class="cp-n cp-n1" type="number"></label>' +
        '<label class="cp-f"><span class="cp-l2"></span><input class="cp-n cp-n2" type="number"></label>' +
        '<button class="cp-icon cp-mode" type="button" title="' + t('mode') + '">⇄</button>' +
      '</div>' +
      '<div class="cp-lbl cp-lbl-mc">' + t('mc') + '</div>' +
      '<div class="cp-sw cp-sw-mc"></div>' +
      '<div class="cp-lbl cp-lbl-recent">' + t('recent') + '</div>' +
      '<div class="cp-sw cp-sw-recent"></div>';
    document.body.appendChild(d);

    /* 原版 16 色 */
    var mcHtml = '';
    C.MC_COLORS.slice(0, 16).forEach(function (m) {
      mcHtml += '<button type="button" class="cp-s" style="background:' + m.hex +
        '" data-hex="' + m.hex + '" title="&' + m.code + '  ' + m.name + '  ' + m.hex + '"></button>';
    });
    d.querySelector('.cp-sw-mc').innerHTML = mcHtml;

    bind(d);
    return d;
  }

  /* ---------- 拖拽区域 ---------- */
  function areaPos(el, e) {
    var r = el.getBoundingClientRect();
    return {
      x: C.clamp01((e.clientX - r.left) / r.width),
      y: C.clamp01((e.clientY - r.top) / r.height)
    };
  }

  function bind(d) {
    var sv = d.querySelector('.cp-sv');
    var hue = d.querySelector('.cp-hue');

    function startDrag(el, kind) {
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        P.drag = kind;
        el.setPointerCapture(e.pointerId);
        move(e);
        function move(ev) {
          var p = areaPos(el, ev);
          if (kind === 'sv') { P.s = p.x; P.v = 1 - p.y; }
          else { P.h = p.x * 360; }
          emit();
        }
        function up(ev) {
          P.drag = null;
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          try { el.releasePointerCapture(ev.pointerId); } catch (err) {}
        }
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    }
    startDrag(sv, 'sv');
    startDrag(hue, 'hue');

    /* 方向键微调饱和度/明度 */
    sv.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.1 : 0.02, hit = true;
      if (e.key === 'ArrowLeft') P.s = C.clamp01(P.s - step);
      else if (e.key === 'ArrowRight') P.s = C.clamp01(P.s + step);
      else if (e.key === 'ArrowUp') P.v = C.clamp01(P.v + step);
      else if (e.key === 'ArrowDown') P.v = C.clamp01(P.v - step);
      else hit = false;
      if (hit) { e.preventDefault(); emit(); }
    });

    /* HEX 输入 */
    d.querySelector('.cp-hex').addEventListener('input', function () {
      var rgb = C.parseHex(this.value);
      if (rgb) { setFromRgb(rgb); emit(this); }
    });

    /* RGB / HSL 数值框 */
    d.querySelectorAll('.cp-n').forEach(function (inp, i) {
      inp.addEventListener('input', function () {
        var vals = [0, 1, 2].map(function (k) {
          return parseFloat(d.querySelector('.cp-n' + k).value) || 0;
        });
        if (mode === 'rgb') {
          setFromRgb([C.clamp(vals[0], 0, 255), C.clamp(vals[1], 0, 255), C.clamp(vals[2], 0, 255)]);
        } else {
          P.h = ((vals[0] % 360) + 360) % 360;
          var hsv = C.rgbToHsv(C.hslToRgb([P.h, C.clamp01(vals[1] / 100), C.clamp01(vals[2] / 100)]));
          P.s = hsv[1]; P.v = hsv[2];
        }
        emit(this);
      });
    });

    d.querySelector('.cp-mode').addEventListener('click', function () {
      mode = mode === 'rgb' ? 'hsl' : 'rgb';
      paint();
    });

    /* 色板 */
    d.addEventListener('click', function (e) {
      var s = e.target.closest('.cp-s');
      if (!s) return;
      setFromRgb(C.parseHex(s.dataset.hex));
      emit();
    });

    /* 吸管 */
    var eye = d.querySelector('.cp-eye');
    if (!window.EyeDropper) eye.style.display = 'none';
    else eye.addEventListener('click', function () {
      new window.EyeDropper().open().then(function (r) {
        setFromRgb(C.parseHex(r.sRGBHex));
        emit();
      }).catch(function () {});
    });

    /* 弹层内部点击不触发外部关闭 */
    d.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  }

  /* ---------- 状态与渲染 ---------- */
  function currentRgb() { return C.hsvToRgb([P.h, P.s, P.v]); }
  function currentHex() { return C.toHex(currentRgb()); }

  function setFromRgb(rgb) {
    var hsv = C.rgbToHsv(rgb);
    /* 灰阶没有有效色相，保留原来的，避免色相条乱跳 */
    if (hsv[1] > 1e-6) P.h = hsv[0];
    P.s = hsv[1]; P.v = hsv[2];
  }

  /* skipEl：正在被输入的那个框不回写，否则光标会跳；其余框照常同步 */
  function paint(skipEl) {
    var d = P.el;
    if (!d) return;
    var rgb = currentRgb(), hex = currentHex();

    d.querySelector('.cp-sv').style.background =
      'linear-gradient(to top, #000, rgba(0,0,0,0)),' +
      'linear-gradient(to right, #fff, hsl(' + P.h.toFixed(1) + ',100%,50%))';
    var dot = d.querySelector('.cp-sv-dot');
    dot.style.left = (P.s * 100) + '%';
    dot.style.top = ((1 - P.v) * 100) + '%';
    dot.style.background = hex;

    d.querySelector('.cp-hue-dot').style.left = (P.h / 360 * 100) + '%';
    d.querySelector('.cp-chip').style.background = hex;

    var hexInput = d.querySelector('.cp-hex');
    if (hexInput !== skipEl) hexInput.value = hex;

    var labels, vals;
    if (mode === 'rgb') {
      labels = ['R', 'G', 'B'];
      vals = rgb.map(function (x) { return Math.round(x); });
    } else {
      labels = ['H', 'S%', 'L%'];
      var hsl = C.rgbToHsl(rgb);
      vals = [Math.round(hsl[0]), Math.round(hsl[1] * 100), Math.round(hsl[2] * 100)];
    }
    [0, 1, 2].forEach(function (i) {
      d.querySelector('.cp-l' + i).textContent = labels[i];
      var inp = d.querySelector('.cp-n' + i);
      inp.max = mode === 'rgb' ? 255 : (i === 0 ? 360 : 100);
      inp.min = 0;
      if (inp !== skipEl) inp.value = vals[i];
    });

    /* 最近使用 */
    var rec = getRecent();
    d.querySelector('.cp-sw-recent').innerHTML = rec.length
      ? rec.map(function (c) {
          return '<button type="button" class="cp-s" style="background:' + c +
            '" data-hex="' + c + '" title="' + c + '"></button>';
        }).join('')
      : '<span class="cp-empty">' + t('none') + '</span>';
  }

  function emit(skipEl) {
    paint(skipEl);
    if (P.onChange) P.onChange(currentHex());
  }

  /* ---------- 定位 ---------- */
  function place() {
    if (!P.el || !P.anchor) return;
    var a = P.anchor.getBoundingClientRect();
    var w = P.el.offsetWidth, h = P.el.offsetHeight;
    var pad = 8;

    var left = a.left;
    if (left + w > window.innerWidth - pad) left = window.innerWidth - w - pad;
    if (left < pad) left = pad;

    var top = a.bottom + 6;
    if (top + h > window.innerHeight - pad) {
      var above = a.top - h - 6;
      if (above >= pad) top = above;
    }
    /* 兜底钳制：锚点本身在视口外时，上面两种放法都可能把弹层甩出屏幕 */
    top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));

    P.el.style.left = Math.round(left) + 'px';
    P.el.style.top = Math.round(top) + 'px';
  }

  /* ---------- 对外接口 ---------- */
  var Picker = {};

  Picker.open = function (anchor, hex, onChange) {
    if (!P.el) P.el = build();
    if (P.anchor) P.anchor.classList.remove('on');
    P.anchor = anchor;
    anchor.classList.add('on');
    P.onChange = onChange;
    setFromRgb(C.parseHex(hex) || [255, 255, 255]);
    P.el.hidden = false;
    P.open = true;
    paint();
    place();
    P.el.querySelector('.cp-sv').focus({ preventScroll: true });
  };

  Picker.close = function () {
    if (!P.open) return;
    pushRecent(currentHex());
    P.open = false;
    P.onChange = null;
    if (P.anchor) P.anchor.classList.remove('on');
    P.anchor = null;
    if (P.el) P.el.hidden = true;
  };

  Picker.isOpen = function () { return P.open; };

  document.addEventListener('pointerdown', function (e) {
    if (!P.open) return;
    if (P.anchor && P.anchor.contains(e.target)) return;
    Picker.close();
  });
  document.addEventListener('keydown', function (e) {
    if (P.open && e.key === 'Escape') { e.stopPropagation(); Picker.close(); }
  });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);

  root.MCPicker = Picker;
})(window);
