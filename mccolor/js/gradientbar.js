/* gradientbar.js — 可拖拽的渐变条编辑器 */
(function (root) {
  'use strict';

  var C = root.MCColor, G = root.MCGradient;

  var Bar = {
    el: null, fill: null, layer: null,
    ctx: null,
    dragging: null
  };

  Bar.mount = function (opts) {
    Bar.el = opts.bar;
    Bar.fill = opts.fill;
    Bar.layer = opts.stops;
    Bar.ctx = opts;

    Bar.el.addEventListener('dblclick', onDblClick);
    Bar.el.addEventListener('keydown', onKey);
    Bar.el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    Bar.layer.addEventListener('pointerdown', onPointerDown);
    Bar.layer.addEventListener('contextmenu', onStopContext);
  };

  function st() { return Bar.ctx.getState(); }

  function posFromEvent(e) {
    var r = Bar.el.getBoundingClientRect();
    if (r.width <= 0) return 0;
    return C.clamp01((e.clientX - r.left) / r.width);
  }

  function stopIndexFromTarget(t) {
    var node = t.closest ? t.closest('.gstop') : null;
    return node ? parseInt(node.dataset.i, 10) : -1;
  }

  function onPointerDown(e) {
    var i = stopIndexFromTarget(e.target);
    if (i < 0) return;
    if (e.button === 2) return;               /* 右键交给 contextmenu */
    e.preventDefault();
    Bar.ctx.onSelect(i);
    Bar.dragging = i;
    Bar.layer.setPointerCapture(e.pointerId);
    Bar.layer.addEventListener('pointermove', onPointerMove);
    Bar.layer.addEventListener('pointerup', onPointerUp);
    Bar.layer.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(e) {
    if (Bar.dragging === null) return;
    var s = st();
    var p = posFromEvent(e);
    if (e.shiftKey) p = Math.round(p * 20) / 20;   /* 按住 Shift 吸附到 5% */
    s.stops[Bar.dragging].pos = p;
    Bar.ctx.onLive();
  }

  function onPointerUp(e) {
    if (Bar.dragging === null) return;
    Bar.dragging = null;
    Bar.layer.removeEventListener('pointermove', onPointerMove);
    Bar.layer.removeEventListener('pointerup', onPointerUp);
    Bar.layer.removeEventListener('pointercancel', onPointerUp);
    try { Bar.layer.releasePointerCapture(e.pointerId); } catch (err) {}
    Bar.ctx.onCommit('stop-drag');
  }

  function onStopContext(e) {
    var i = stopIndexFromTarget(e.target);
    e.preventDefault();
    if (i < 0) return;
    Bar.ctx.onDelete(i);
  }

  function onDblClick(e) {
    if (stopIndexFromTarget(e.target) >= 0) return;
    var p = posFromEvent(e);
    Bar.ctx.onAdd(p);
  }

  function onKey(e) {
    var sel = Bar.ctx.getSel();
    var s = st();
    if (sel < 0 || sel >= s.stops.length) return;
    var step = e.shiftKey ? 0.05 : 0.005;
    if (e.key === 'ArrowLeft') {
      s.stops[sel].pos = C.clamp01(s.stops[sel].pos - step);
      Bar.ctx.onCommit('nudge'); e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      s.stops[sel].pos = C.clamp01(s.stops[sel].pos + step);
      Bar.ctx.onCommit('nudge'); e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      Bar.ctx.onDelete(sel); e.preventDefault();
    }
  }

  Bar.render = function () {
    var s = st();
    var sel = Bar.ctx.getSel();
    Bar.fill.style.background = G.toCss(s.stops, s.space, s.hueDir, 48);

    var html = '';
    s.stops.forEach(function (stop, i) {
      html += '<div class="gstop' + (i === sel ? ' sel' : '') + '" data-i="' + i +
        '" style="left:' + (stop.pos * 100).toFixed(3) + '%" title="' + stop.color + '">' +
        '<span class="gstop-dot" style="background:' + stop.color + '"></span>' +
        '<span class="gstop-line"></span></div>';
    });
    Bar.layer.innerHTML = html;
  };

  root.MCBar = Bar;
})(window);
