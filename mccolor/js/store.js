/* store.js — 状态、撤销/重做、本地存储、分享链接 */
(function (root) {
  'use strict';

  var LS_STATE = 'mcgrad.state.v1';
  var LS_PRESETS = 'mcgrad.presets.v1';
  var LS_PREFS = 'mcgrad.prefs.v1';

  function defaults() {
    return {
      text: 'Hello Minecraft',
      styleMask: [],
      colorOverride: [],
      stops: [
        { color: '#FF0000', pos: 0 },
        { color: '#FFAA00', pos: 0.5 },
        { color: '#FFFF55', pos: 1 }
      ],
      space: 'oklab',
      hueDir: 'short',
      easing: 'linear',
      loop: 'once',
      repeats: 2,
      offset: 0,
      unit: 'char',
      gran: 1,
      lines: 'continuous',
      lineShift: 20,
      skipSpaces: true,
      compress: true,
      quantize: 0,
      styles: { bold: false, italic: false, underline: false, strike: false, obf: false }
    };
  }

  var Store = {
    state: defaults(),
    prefs: {
      lang: 'zh', theme: 'light', bg: 'chat', bgColor: '#2B2B2B', bgImage: '',
      scale: 26, shadow: true, animObf: true,
      player: 'Steve', group: 'default', target: '@a', item: 'diamond_sword', miniShort: false
    },
    _undo: [],
    _redo: [],
    _listeners: [],
    _lastSnap: null
  };

  Store.defaults = defaults;

  Store.on = function (fn) { Store._listeners.push(fn); };
  Store.emit = function (reason) {
    Store._listeners.forEach(function (f) { f(Store.state, reason); });
  };

  function snapshot() {
    return JSON.stringify({ s: Store.state });
  }

  /* 记录一次可撤销的变更（连续的同类操作会被 coalesce 掉） */
  Store.commit = function (reason) {
    var snap = snapshot();
    if (snap !== Store._lastSnap) {
      if (Store._lastSnap !== null) {
        Store._undo.push(Store._lastSnap);
        if (Store._undo.length > 80) Store._undo.shift();
      }
      Store._lastSnap = snap;
      Store._redo.length = 0;
    }
    Store.save();
    Store.emit(reason);
  };

  /* 只刷新，不进撤销栈（拖拽过程中用） */
  Store.touch = function (reason) { Store.emit(reason); };

  Store.undo = function () {
    if (!Store._undo.length) return false;
    Store._redo.push(snapshot());
    var s = Store._undo.pop();
    Store.state = JSON.parse(s).s;
    Store._lastSnap = s;
    Store.save();
    Store.emit('undo');
    return true;
  };

  Store.redo = function () {
    if (!Store._redo.length) return false;
    Store._undo.push(snapshot());
    var s = Store._redo.pop();
    Store.state = JSON.parse(s).s;
    Store._lastSnap = s;
    Store.save();
    Store.emit('redo');
    return true;
  };

  Store.canUndo = function () { return Store._undo.length > 0; };
  Store.canRedo = function () { return Store._redo.length > 0; };

  /* ---------- 持久化 ---------- */
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  /* 返回是否真的写进去了：隐私模式或超配额都会失败 */
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }

  Store.save = function () {
    return safeSet(LS_STATE, JSON.stringify(Store.state));
  };
  Store.savePrefs = function () {
    return safeSet(LS_PREFS, JSON.stringify(Store.prefs));
  };

  Store.load = function () {
    var p = safeGet(LS_PREFS);
    if (p) { try { Object.assign(Store.prefs, JSON.parse(p)); } catch (e) {} }
    var s = safeGet(LS_STATE);
    if (s) { try { Store.state = migrate(JSON.parse(s)); } catch (e) {} }
  };

  function migrate(s) {
    var d = defaults();
    var out = Object.assign(d, s || {});
    if (!Array.isArray(out.stops) || out.stops.length < 2) out.stops = d.stops;
    out.stops = out.stops.map(function (st) {
      return {
        color: root.MCColor.isHex(st.color) ? root.MCColor.toHex(root.MCColor.parseHex(st.color)) : '#FFFFFF',
        pos: Math.max(0, Math.min(1, Number(st.pos) || 0))
      };
    });
    if (!Array.isArray(out.styleMask)) out.styleMask = [];
    if (!Array.isArray(out.colorOverride)) out.colorOverride = [];
    out.colorOverride = out.colorOverride.map(function (c) {
      return (c && root.MCColor.isHex(c)) ? root.MCColor.toHex(root.MCColor.parseHex(c)) : null;
    });
    out.styles = Object.assign(d.styles, out.styles || {});
    return out;
  }
  Store.migrate = migrate;

  /* ---------- 自定义预设 ---------- */
  Store.getMyPresets = function () {
    var raw = safeGet(LS_PRESETS);
    if (!raw) return [];
    try { var a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  };
  Store.setMyPresets = function (arr) { safeSet(LS_PRESETS, JSON.stringify(arr)); };

  Store.addMyPreset = function (name, colors) {
    var list = Store.getMyPresets();
    list.unshift({ id: 'my-' + Date.now(), name: name, colors: colors, cat: 'mine' });
    Store.setMyPresets(list);
    return list;
  };
  Store.removeMyPreset = function (id) {
    var list = Store.getMyPresets().filter(function (p) { return p.id !== id; });
    Store.setMyPresets(list);
    return list;
  };

  /* ---------- 分享链接 ---------- */
  function b64url(str) {
    var utf8 = unescape(encodeURIComponent(str));
    return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  Store.toLink = function () {
    var payload = JSON.stringify(Store.state);
    /* 用 href 而不是 origin+pathname，这样 file:// 直接打开时也能生成有效链接 */
    return location.href.split('#')[0] + '#g=' + b64url(payload);
  };

  Store.fromHash = function () {
    var h = location.hash || '';
    var m = h.match(/[#&]g=([^&]+)/);
    if (!m) return false;
    try {
      Store.state = migrate(JSON.parse(unb64url(m[1])));
      return true;
    } catch (e) { return false; }
  };

  /* ---------- 导入 / 导出 ---------- */
  Store.exportBundle = function () {
    return JSON.stringify({
      kind: 'mcgradient',
      version: 1,
      state: Store.state,
      presets: Store.getMyPresets()
    }, null, 2);
  };

  Store.importBundle = function (text) {
    var data = JSON.parse(text);
    if (data && data.kind === 'mcgradient') {
      if (data.state) Store.state = migrate(data.state);
      if (Array.isArray(data.presets) && data.presets.length) {
        var mine = Store.getMyPresets();
        var ids = {};
        mine.forEach(function (p) { ids[p.id] = 1; });
        data.presets.forEach(function (p) { if (!ids[p.id]) mine.push(p); });
        Store.setMyPresets(mine);
      }
      return true;
    }
    /* 也接受裸的状态对象或颜色数组 */
    if (Array.isArray(data) && data.every(root.MCColor.isHex)) {
      Store.state.stops = data.map(function (c, i) {
        return { color: root.MCColor.toHex(root.MCColor.parseHex(c)), pos: data.length > 1 ? i / (data.length - 1) : 0 };
      });
      return true;
    }
    if (data && data.stops) { Store.state = migrate(data); return true; }
    return false;
  };

  root.MCStore = Store;
})(window);
