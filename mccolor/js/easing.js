/* easing.js — 缓动曲线与循环变换 */
(function (root) {
  'use strict';

  var E = {};

  E.fns = {
    linear: function (t) { return t; },
    in:     function (t) { return t * t; },
    out:    function (t) { return 1 - (1 - t) * (1 - t); },
    inout:  function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    expo:   function (t) { return t <= 0 ? 0 : (t >= 1 ? 1 : Math.pow(2, 10 * t - 10)); },
    sine:   function (t) { return 1 - Math.cos((t * Math.PI) / 2); },
    step:   function (t) { return Math.round(t * 6) / 6; }
  };

  E.apply = function (name, t) {
    var f = E.fns[name] || E.fns.linear;
    return f(root.MCColor.clamp01(t));
  };

  /* 把 [0,1] 的原始进度，按 offset / 循环模式 变换成采样位置 */
  E.transform = function (t, opts) {
    var v = t + (opts.offset || 0);
    var mode = opts.loop || 'once';
    var n = Math.max(1, opts.repeats || 1);

    if (mode === 'repeat') {
      v = v * n;
      v = v - Math.floor(v);
    } else if (mode === 'bounce') {
      v = v * n;
      var whole = Math.floor(v), frac = v - whole;
      v = (((whole % 2) + 2) % 2) === 0 ? frac : 1 - frac;
    } else {
      /* 单程：offset 之后循环回绕，这样偏移才有意义 */
      if (opts.offset) { v = v - Math.floor(v); }
      v = root.MCColor.clamp01(v);
    }
    return v;
  };

  root.MCEase = E;
})(window);
