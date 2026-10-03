/* app.js — 界面装配与全部交互 */
(function (root) {
  'use strict';

  var C = root.MCColor, G = root.MCGradient, F = root.MCFormats;
  var Store = root.MCStore, Bar = root.MCBar, Preview = root.MCPreview, Picker = root.MCPicker;
  var I18N = root.I18N, Presets = root.MCPresets;

  var $ = function (id) { return document.getElementById(id); };
  var S = G.S;

  var ui = {};
  var selStop = 0;
  var presetCat = 'all';
  var outGroup = 'plugin';
  var lastBuild = null;
  var commitTimer = null;

  /* ================= 工具 ================= */

  /* 统计事件上报。Umami 没加载（本地开发、被拦截插件挡了）时静默跳过 */
  function track(name, data) {
    try {
      if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track(name, data);
      }
    } catch (e) { /* 统计出错绝不能影响功能 */ }
  }

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 1800);
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      toast(I18N.t(ok ? 'copy.done' : 'copy.fail'));
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        toast(I18N.t('copy.done'));
      }, fallback);
    } else fallback();
  }

  /* UTF-16 下标 -> 码点下标 */
  function cpIndex(str, i) { return Array.from(str.slice(0, i)).length; }

  /* 改字时把逐字数据跟着挪位置：比对首尾公共部分，中间新插入的字取 fill */
  function remapArray(oldText, newText, arr, fill) {
    var a = Array.from(oldText || ''), b = Array.from(newText || '');
    var p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    var sa = a.length, sb = b.length;
    while (sa > p && sb > p && a[sa - 1] === b[sb - 1]) { sa--; sb--; }
    var v = typeof fill === 'function' ? fill(p, arr) : fill;
    var mid = [];
    for (var k = p; k < sb; k++) mid.push(v);
    return arr.slice(0, p).concat(mid, arr.slice(sa));
  }

  function ensureMaskLength() {
    var n = Array.from(Store.state.text).length;
    var m = Store.state.styleMask;
    while (m.length < n) m.push(0);
    if (m.length > n) m.length = n;
    var o = Store.state.colorOverride;
    while (o.length < n) o.push(null);
    if (o.length > n) o.length = n;
  }

  /* ================= 渲染 ================= */

  function scheduleCommit(reason) {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(function () { Store.commit(reason); }, 450);
  }

  function renderAll() {
    ensureMaskLength();
    var st = Store.state;
    lastBuild = G.build(st);

    Bar.render();
    /* 取色器打开时别重建色标列表，否则弹层锚定的那个按钮会被换掉 */
    if (!Picker.isOpen()) renderStopList();
    Preview.render(lastBuild, st, Store.prefs);
    renderOutputs();
    renderStats();
    renderCharGrid();
    syncStyleButtons();
    $('btnUndo').disabled = !Store.canUndo();
    $('btnRedo').disabled = !Store.canRedo();
  }

  /* ---------- 色标列表 ---------- */
  function renderStopList() {
    var st = Store.state;
    var html = '';
    st.stops.forEach(function (s, i) {
      html +=
        '<div class="stop-row' + (i === selStop ? ' sel' : '') + '" data-i="' + i + '">' +
          '<span class="stop-idx">' + (i + 1) + '</span>' +
          '<button type="button" class="sw-btn" data-act="color" style="background:' + s.color +
            '" title="' + s.color + '"></button>' +
          '<input type="text" class="stop-hex mono" value="' + s.color + '" data-act="hex" spellcheck="false" maxlength="7">' +
          '<span class="stop-pos-wrap"><input type="range" class="stop-pos" min="0" max="1000" step="1" value="' +
            Math.round(s.pos * 1000) + '" data-act="pos"></span>' +
          '<span class="stop-pos-num">' + (s.pos * 100).toFixed(1) + '%</span>' +
          '<button class="stop-del" data-act="del" title="×">×</button>' +
        '</div>';
    });
    $('stopList').innerHTML = html;
  }

  /* ---------- 统计与警告 ---------- */
  function renderStats() {
    var b = lastBuild, st = Store.state;
    var html = '';
    function chip(label, val, cls) {
      return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + label + ' <b>' + val + '</b></span>';
    }
    html += chip(I18N.t('stat.chars'), b.stats.visible);
    html += chip(I18N.t('stat.colors'), b.stats.colors);
    html += chip(I18N.t('stat.segments'), b.stats.segments);
    if (b.stats.lines > 1) html += chip(I18N.t('stat.lines'), b.stats.lines);
    $('stats').innerHTML = html;

    /* 预警框只放「别处看不到」的信息 —— 各格式自身的长度上限已经在结果卡片上标红了 */
    var warns = [];
    if (st.stops.length < 2) warns.push(I18N.t('warn.stops'));
    if (outGroup === 'vanilla') {
      st.text.split('\n').forEach(function (l, i) {
        var vis = Array.from(l).length;
        if (vis > 15) warns.push(I18N.t('warn.sign', i + 1, vis));
      });
    }

    var wb = $('limitWarn');
    if (!warns.length) { wb.hidden = true; wb.innerHTML = ''; }
    else {
      wb.hidden = false;
      wb.innerHTML = '<b>' + I18N.t('warn.title') + '</b><ul><li>' + warns.join('</li><li>') + '</li></ul>';
    }
  }

  /* ---------- 输出 ---------- */
  function outOpts() {
    var p = Store.prefs;
    function v(k, d) { return String(p[k] == null ? d : p[k]).trim() || d; }
    return {
      miniShort: !!p.miniShort,
      target: v('target', '@a'),
      item: v('item', 'diamond_sword'),
      player: v('player', 'Steve'),
      group: v('group', 'default')
    };
  }

  var PARAM_LABEL = { player: 'lbl.player', group: 'lbl.group', target: 'lbl.cmdTarget', item: 'lbl.item' };
  var PARAM_SIZE = { player: 10, group: 10, target: 6, item: 14 };

  /* 参数字段只在用得上的分类里出现，免得凭空冒出来看不懂 */
  function renderOutParams() {
    var fields = F.groupFields[outGroup] || [];
    var el = $('outParams');
    if (!fields.length) {
      el.innerHTML = '<span class="lead">' + I18N.t('params.none') + '</span>';
      return;
    }
    var html = '<span class="lead">' + I18N.t('params.lead') + '</span>';
    fields.forEach(function (f) {
      if (f === 'miniShort') {
        html += '<label class="check"><input type="checkbox" data-param="miniShort"' +
          (Store.prefs.miniShort ? ' checked' : '') + '><span>' + escHtml(I18N.t('lbl.miniShort')) + '</span></label>';
      } else {
        html += '<label class="field field-inline"><span>' + escHtml(I18N.t(PARAM_LABEL[f])) + '</span>' +
          '<input type="text" class="mini-input mono" data-param="' + f + '" value="' +
          escAttr(Store.prefs[f]) + '" size="' + PARAM_SIZE[f] + '"></label>';
      }
    });
    el.innerHTML = html;
  }

  function escAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function renderOutTabs() {
    var html = '';
    F.groups.forEach(function (g) {
      html += '<button class="tab' + (g === outGroup ? ' on' : '') + '" data-g="' + g + '">' +
        I18N.t('og.' + g) + '</button>';
    });
    $('outTabs').innerHTML = html;
  }

  function renderOutputs() {
    var st = Store.state, o = outOpts(), lang = I18N.getLang();
    var html = '';
    F.list.forEach(function (f) {
      if (f.group !== outGroup) return;
      var text;
      try { text = f.render(lastBuild, st, o); }
      catch (e) { text = '/* error: ' + e.message + ' */'; }
      var len = f.lenOf ? f.lenOf(lastBuild) : text.length;
      var bad = f.limit && len > f.limit;
      var rows = Math.min(6, Math.max(1, text.split('\n').length));
      html +=
        '<div class="out-item" data-id="' + f.id + '">' +
          '<div class="out-head">' +
            '<div><span class="out-name">' + f.name[lang] + '</span>' +
              '<span class="out-desc">' + f.desc[lang] + '</span></div>' +
            '<div class="out-meta">' +
              '<span class="out-len' + (bad ? ' bad' : '') + '">' + len +
                (f.limit ? ' / ' + f.limit : '') + '</span>' +
              '<button class="btn btn-mini" data-copy="' + f.id + '">' +
                (lang === 'zh' ? '复制' : 'Copy') + '</button>' +
            '</div>' +
          '</div>' +
          '<textarea class="out-box mono" readonly rows="' + rows + '"></textarea>' +
        '</div>';
    });
    $('outList').innerHTML = html;

    /* 用 value 赋值，避免 HTML 转义问题 */
    F.list.forEach(function (f) {
      if (f.group !== outGroup) return;
      var box = $('outList').querySelector('[data-id="' + f.id + '"] .out-box');
      if (box) {
        try { box.value = f.render(lastBuild, st, o); }
        catch (e) { box.value = '/* error: ' + e.message + ' */'; }
      }
    });
  }

  /* ---------- 预设 ---------- */
  function renderPresetTabs() {
    var html = '';
    Presets.cats.forEach(function (c) {
      html += '<button class="tab' + (c === presetCat ? ' on' : '') + '" data-c="' + c + '">' +
        I18N.t('cat.' + c) + '</button>';
    });
    $('presetTabs').innerHTML = html;
  }

  function allPresets() {
    var mine = Store.getMyPresets().map(function (p) {
      return { id: p.id, zh: p.name, en: p.name, cat: 'mine', colors: p.colors, mine: true };
    });
    return mine.concat(Presets.list);
  }

  function renderPresets() {
    var lang = I18N.getLang();
    var list = allPresets().filter(function (p) {
      return presetCat === 'all' ? true : p.cat === presetCat;
    });
    var html = '';
    list.forEach(function (p) {
      var stops = p.colors.map(function (c, i) {
        return { color: c, pos: p.colors.length > 1 ? i / (p.colors.length - 1) : 0 };
      });
      html += '<div class="preset" data-p="' + p.id + '" title="' + (p[lang] || p.zh) + '">' +
        '<div class="preset-sw" style="background:' + G.toCss(stops, Store.state.space, Store.state.hueDir, 20) + '"></div>' +
        '<div class="preset-name">' + (p[lang] || p.zh) + '</div>' +
        (p.mine ? '<button class="preset-x" data-del="' + p.id + '">×</button>' : '') +
        '</div>';
    });
    if (!list.length) {
      html = '<p class="hint" style="grid-column:1/-1">' +
        (lang === 'zh' ? '还没有自定义预设，点下面的「保存当前为预设」。'
                       : 'No saved presets yet — use “Save current”.') + '</p>';
    }
    $('presetGrid').innerHTML = html;
  }

  function applyColors(colors) {
    Store.state.stops = colors.map(function (c, i) {
      return { color: C.toHex(C.parseHex(c) || [255, 255, 255]), pos: colors.length > 1 ? i / (colors.length - 1) : 0 };
    });
    selStop = 0;
    Store.commit('preset');
  }

  /* ================= 逐字精修 ================= */

  var charSel = new Set();
  var charAnchor = -1;
  var charPickColor = '#FFFFFF';
  var CHAR_LIMIT = 600;      /* 超过这么多字就不铺格子了，否则 DOM 太重 */

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCharGrid() {
    var grid = $('charGrid');
    if (!grid || !$('charEditorBox').open) return;   /* 折叠着就不铺格子，省性能 */
    var chars = lastBuild.chars, colors = lastBuild.colors;
    var mask = Store.state.styleMask, ov = Store.state.colorOverride || [];

    if (chars.length > CHAR_LIMIT) {
      grid.innerHTML = '<p class="hint">' +
        (I18N.getLang() === 'zh' ? '文字超过 ' + CHAR_LIMIT + ' 个，逐字精修已关闭。'
                                 : 'Over ' + CHAR_LIMIT + ' characters — per-character editing is off.') + '</p>';
      $('charSelInfo').textContent = '';
      return;
    }

    var html = '';
    chars.forEach(function (ch, i) {
      if (ch === '\n') { html += '<div class="char-tile nl"></div>'; return; }
      var cls = 'char-tile' + (charSel.has(i) ? ' sel' : '') + (ov[i] ? ' ov' : '');
      var m = mask[i] | 0;
      var style = 'color:' + (colors[i] || '#FFFFFF') + ';';
      if (m & S.BOLD) style += 'font-weight:700;';
      if (m & S.ITALIC) style += 'font-style:italic;';
      var dec = [];
      if (m & S.UNDER) dec.push('underline');
      if (m & S.STRIKE) dec.push('line-through');
      if (dec.length) style += 'text-decoration:' + dec.join(' ') + ';';
      html += '<div class="' + cls + '" data-i="' + i + '" style="' + style + '">' +
        (ch === ' ' ? '␣' : escHtml(ch)) + '</div>';
    });
    grid.innerHTML = html;
    $('charSelInfo').textContent = charSel.size ? I18N.t('char.count', charSel.size) : I18N.t('char.none');
    syncCharStyleButtons();
  }

  function syncCharStyleButtons() {
    var m = Store.state.styleMask;
    document.querySelectorAll('.sbtn[data-cstyle]').forEach(function (btn) {
      var bit = G.STYLE_KEYS[btn.dataset.cstyle];
      var on = 0;
      charSel.forEach(function (i) { if (m[i] & bit) on++; });
      btn.classList.toggle('on', charSel.size > 0 && on === charSel.size);
      btn.classList.toggle('mixed', on > 0 && on < charSel.size);
    });
  }

  function eachSelected(fn) {
    if (!charSel.size) { toast(I18N.t('char.needSel')); return false; }
    charSel.forEach(fn);
    return true;
  }

  function bindCharEditor() {
    $('charEditorBox').addEventListener('toggle', function () {
      renderCharGrid();
      if (this.open) track('char-editor-open');   /* 这个功能的发现率 */
    });

    $('charGrid').addEventListener('click', function (e) {
      var t = e.target.closest('.char-tile');
      if (!t || t.classList.contains('nl')) return;
      var i = +t.dataset.i;
      if (e.shiftKey && charAnchor >= 0) {
        charSel.clear();
        var a = Math.min(charAnchor, i), b = Math.max(charAnchor, i);
        for (var k = a; k <= b; k++) if (lastBuild.chars[k] !== '\n') charSel.add(k);
      } else if (e.ctrlKey || e.metaKey) {
        if (charSel.has(i)) charSel.delete(i); else charSel.add(i);
        charAnchor = i;
      } else {
        charSel.clear(); charSel.add(i); charAnchor = i;
      }
      renderCharGrid();
      /* 取色按钮同步成第一个选中字符的当前颜色 */
      var first = Infinity;
      charSel.forEach(function (x) { if (x < first) first = x; });
      if (first !== Infinity) {
        charPickColor = lastBuild.colors[first] || '#FFFFFF';
        $('charColor').style.background = charPickColor;
        $('charColor').title = charPickColor;
      }
    });

    $('btnCharColor').onclick = function () {
      var col = charPickColor;
      if (eachSelected(function (i) { Store.state.colorOverride[i] = col; })) {
        Store.commit('char-color');
        track('char-edit', { action: 'color', chars: charSel.size });
      }
    };
    $('charColor').addEventListener('click', function () {
      var btn = this;
      Picker.open(btn, charPickColor, function (hex) {
        charPickColor = hex;
        btn.style.background = hex;
        btn.title = hex;
        if (!charSel.size) return;
        charSel.forEach(function (i) { Store.state.colorOverride[i] = hex; });
        renderLight(); renderCharGrid(); scheduleCommit('char-color');
      });
    });
    $('btnCharClear').onclick = function () {
      if (eachSelected(function (i) { Store.state.colorOverride[i] = null; })) Store.commit('char-clear');
    };
    $('btnCharAll').onclick = function () {
      charSel.clear();
      lastBuild.chars.forEach(function (ch, i) { if (ch !== '\n') charSel.add(i); });
      charAnchor = 0;
      renderCharGrid();
    };
    $('btnCharNone').onclick = function () { charSel.clear(); charAnchor = -1; renderCharGrid(); };
    $('btnCharResetAll').onclick = function () {
      Store.state.colorOverride = [];
      Store.commit('char-reset');
      toast(I18N.t('char.cleared'));
    };

    document.querySelectorAll('.sbtn[data-cstyle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var bit = G.STYLE_KEYS[btn.dataset.cstyle];
        if (!charSel.size) { toast(I18N.t('char.needSel')); return; }
        var all = true;
        charSel.forEach(function (i) { if (!(Store.state.styleMask[i] & bit)) all = false; });
        charSel.forEach(function (i) {
          Store.state.styleMask[i] = all ? (Store.state.styleMask[i] & ~bit)
                                         : (Store.state.styleMask[i] | bit);
        });
        Store.commit('char-style');
        track('char-edit', { action: 'style-' + btn.dataset.cstyle, chars: charSel.size });
      });
    });
  }

  /* ================= 样式 ================= */

  function selectionRange() {
    var ta = ui.text;
    if (document.activeElement !== ta) return null;
    if (ta.selectionStart === ta.selectionEnd) return null;
    return [cpIndex(ta.value, ta.selectionStart), cpIndex(ta.value, ta.selectionEnd)];
  }

  function toggleStyle(key) {
    var bit = G.STYLE_KEYS[key];
    ensureMaskLength();
    var m = Store.state.styleMask;
    var range = selectionRange();
    var from = range ? range[0] : 0;
    var to = range ? range[1] : m.length;
    if (to <= from) return;

    var all = true;
    for (var i = from; i < to; i++) if (!(m[i] & bit)) { all = false; break; }
    for (var j = from; j < to; j++) m[j] = all ? (m[j] & ~bit) : (m[j] | bit);

    if (!range) Store.state.styles[key] = !all;
    Store.commit('style');
  }

  function syncStyleButtons() {
    var m = Store.state.styleMask;
    var range = selectionRange();
    var from = range ? range[0] : 0;
    var to = range ? range[1] : m.length;
    document.querySelectorAll('.sbtn[data-style]').forEach(function (btn) {
      var bit = G.STYLE_KEYS[btn.dataset.style];
      var on = 0, cnt = 0;
      for (var i = from; i < to; i++) { cnt++; if (m[i] & bit) on++; }
      btn.classList.toggle('on', cnt > 0 && on === cnt);
      btn.classList.toggle('mixed', on > 0 && on < cnt);
    });
  }

  /* ================= 绑定 ================= */

  function bindTopbar() {
    $('btnUndo').onclick = function () { if (Store.undo()) { selStop = Math.min(selStop, Store.state.stops.length - 1); syncControls(); } };
    $('btnRedo').onclick = function () { if (Store.redo()) { selStop = Math.min(selStop, Store.state.stops.length - 1); syncControls(); } };

    $('btnShare').onclick = function () {
      var link = Store.toLink();
      try { history.replaceState(null, '', '#g=' + link.split('#g=')[1]); } catch (e) { /* file:// 下不允许 */ }
      copyText(link);
      setTimeout(function () { toast(I18N.t('share.done')); }, 60);
      track('share-link');
    };

    $('btnTheme').onclick = function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      $('themeIco').textContent = next === 'dark' ? '☀' : '☾';
      Store.prefs.theme = next;
      Store.savePrefs();
      track('theme', { to: next });
    };

    $('btnLang').onclick = function () {
      var next = I18N.getLang() === 'zh' ? 'en' : 'zh';
      I18N.setLang(next);
      $('btnLang').textContent = next === 'zh' ? 'EN' : '中';
      Store.prefs.lang = next;
      Store.savePrefs();
      applyLangBlocks(next);
      syncLangUrl(next);
      renderPresetTabs(); renderPresets(); renderOutTabs(); renderOutParams();
      syncControls();
      $('helpBody').innerHTML = I18N.t('help.body');
      track('lang-switch', { to: next });
    };

    $('btnHelp').onclick = function () {
      $('helpBody').innerHTML = I18N.t('help.body');
      $('helpModal').hidden = false;
    };
    $('helpClose').onclick = function () { $('helpModal').hidden = true; };
    $('helpModal').onclick = function (e) { if (e.target === $('helpModal')) $('helpModal').hidden = true; };
  }

  function bindText() {
    ui.text = $('inputText');
    ui.text.addEventListener('input', function () {
      var old = Store.state.text, next = ui.text.value;
      Store.state.styleMask = remapArray(old, next, Store.state.styleMask, function (p, arr) {
        return p > 0 ? (arr[p - 1] | 0) : 0;      /* 新打的字继承前一个字的样式 */
      });
      Store.state.colorOverride = remapArray(old, next, Store.state.colorOverride, null);
      Store.state.text = next;
      charSel.clear(); charAnchor = -1;
      renderAll();
      scheduleCommit('text');
    });
    ['select', 'keyup', 'mouseup', 'focus', 'blur'].forEach(function (ev) {
      ui.text.addEventListener(ev, function () { setTimeout(syncStyleButtons, 0); });
    });

    document.querySelectorAll('.sbtn[data-style]').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () { toggleStyle(btn.dataset.style); });
    });

    $('btnClearStyles').onclick = function () {
      Store.state.styleMask = Store.state.styleMask.map(function () { return 0; });
      Object.keys(Store.state.styles).forEach(function (k) { Store.state.styles[k] = false; });
      Store.commit('clear-styles');
      toast(I18N.t('reset.styles'));
    };
  }

  function bindGradientBar() {
    Bar.mount({
      bar: $('gbar'), fill: $('gbarFill'), stops: $('gbarStops'),
      getState: function () { return Store.state; },
      getSel: function () { return selStop; },
      onSelect: function (i) { selStop = i; Bar.render(); renderStopList(); },
      onLive: function () { Bar.render(); renderStopList(); Preview.render(G.build(Store.state), Store.state, Store.prefs); },
      onCommit: function (r) { Store.commit(r); },
      onAdd: function (pos) { addStopAt(pos); },
      onDelete: function (i) { deleteStop(i); }
    });

    $('stopList').addEventListener('input', function (e) {
      var row = e.target.closest('.stop-row');
      if (!row) return;
      var i = +row.dataset.i, act = e.target.dataset.act;
      if (act === 'hex') {
        var rgb = C.parseHex(e.target.value);
        if (rgb) {
          Store.state.stops[i].color = C.toHex(rgb);
          row.querySelector('[data-act="color"]').style.background = C.toHex(rgb);
          renderLight(); scheduleCommit('stop-hex');
        }
      } else if (act === 'pos') {
        Store.state.stops[i].pos = (+e.target.value) / 1000;
        row.querySelector('.stop-pos-num').textContent = (Store.state.stops[i].pos * 100).toFixed(1) + '%';
        renderLight(); scheduleCommit('stop-pos');
      }
    });

    $('stopList').addEventListener('click', function (e) {
      var row = e.target.closest('.stop-row');
      if (!row) return;
      var i = +row.dataset.i;
      var act = e.target.dataset.act;

      if (act === 'del') { deleteStop(i); return; }

      if (act === 'color') {
        selStop = i; Bar.render(); renderStopList();
        var btn = $('stopList').querySelector('.stop-row[data-i="' + i + '"] [data-act="color"]');
        Picker.open(btn, Store.state.stops[i].color, function (hex) {
          Store.state.stops[i].color = hex;
          btn.style.background = hex;
          btn.title = hex;
          var hexInput = btn.parentNode.querySelector('[data-act="hex"]');
          if (hexInput) hexInput.value = hex;
          renderLight();
          scheduleCommit('stop-color');
        });
        return;
      }

      selStop = i; Bar.render(); renderStopList();
    });

    $('btnAddStop').onclick = function () { addStopAt(null); };
    $('btnDistribute').onclick = function () {
      var s = Store.state.stops;
      s.sort(function (a, b) { return a.pos - b.pos; });
      s.forEach(function (st, i) { st.pos = s.length > 1 ? i / (s.length - 1) : 0; });
      Store.commit('distribute');
    };
    $('btnReverse').onclick = function () {
      var s = Store.state.stops.slice().sort(function (a, b) { return a.pos - b.pos; });
      var cols = s.map(function (x) { return x.color; }).reverse();
      s.forEach(function (x, i) { x.color = cols[i]; });
      Store.state.stops = s;
      Store.commit('reverse');
    };
    $('btnRandom').onclick = randomGradient;

    if (window.EyeDropper) {
      var b = $('btnEyedrop');
      b.hidden = false;
      b.onclick = function () {
        new window.EyeDropper().open().then(function (r) {
          var i = Math.max(0, Math.min(selStop, Store.state.stops.length - 1));
          Store.state.stops[i].color = C.toHex(C.parseHex(r.sRGBHex));
          Store.commit('eyedrop');
          track('eyedropper');
        }).catch(function () { toast(I18N.t('eyedrop.fail')); });
      };
    }

    $('imgPick').onchange = function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var cols = C.extractFromImage(img, 5);
          if (cols && cols.length) {
            applyColors(cols);
            toast(I18N.t('img.done', cols.length));
            track('from-image', { colors: cols.length });
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };
  }

  function renderLight() {
    lastBuild = G.build(Store.state);
    Bar.render();
    Preview.render(lastBuild, Store.state, Store.prefs);
    renderOutputs();
    renderStats();
  }

  function addStopAt(pos) {
    var s = Store.state.stops;
    var ns = s.slice().sort(function (a, b) { return a.pos - b.pos; })
      .map(function (x) { return { rgb: C.parseHex(x.color), pos: x.pos }; });
    if (pos === null) {
      /* 插在最大空隙的中点 */
      var best = 0.5, gap = -1;
      for (var i = 0; i < ns.length - 1; i++) {
        var d = ns[i + 1].pos - ns[i].pos;
        if (d > gap) { gap = d; best = (ns[i].pos + ns[i + 1].pos) / 2; }
      }
      pos = ns.length < 2 ? 1 : best;
    }
    var col = C.toHex(G.sample(ns, pos, Store.state.space, Store.state.hueDir));
    s.push({ color: col, pos: C.clamp01(pos) });
    s.sort(function (a, b) { return a.pos - b.pos; });
    selStop = s.findIndex(function (x) { return x.pos === pos && x.color === col; });
    if (selStop < 0) selStop = s.length - 1;
    Store.commit('add-stop');
  }

  function deleteStop(i) {
    if (Store.state.stops.length <= 2) { toast(I18N.t('warn.stops')); return; }
    Store.state.stops.splice(i, 1);
    selStop = Math.max(0, Math.min(selStop, Store.state.stops.length - 1));
    Store.commit('del-stop');
  }

  function randomGradient() {
    var schemes = ['complement', 'triad', 'analogous', 'split', 'tetrad'];
    var sc = schemes[(Math.random() * schemes.length) | 0];
    var n = 2 + ((Math.random() * 3) | 0);
    applyColors(C.randomPalette(sc, n));
    toast(I18N.t('random.done'));
    track('random-gradient', { scheme: sc, stops: n });
  }

  function bindOptions() {
    function bindSel(id, key, after) {
      $(id).addEventListener('change', function () {
        Store.state[key] = $(id).value;
        if (after) after();
        Store.commit(key);
      });
    }
    bindSel('selSpace', 'space', updateConditional);
    bindSel('selHue', 'hueDir');
    bindSel('selEasing', 'easing');
    bindSel('selLoop', 'loop', updateConditional);
    bindSel('selUnit', 'unit', updateConditional);
    bindSel('selLines', 'lines', updateConditional);

    $('numRepeats').addEventListener('input', function () {
      Store.state.repeats = Math.max(1, +this.value || 1);
      renderLight(); scheduleCommit('repeats');
    });
    $('numGran').addEventListener('input', function () {
      Store.state.gran = Math.max(1, +this.value || 1);
      renderLight(); scheduleCommit('gran');
    });
    $('rngOffset').addEventListener('input', function () {
      Store.state.offset = (+this.value) / 100;
      $('valOffset').textContent = this.value + '%';
      renderLight(); scheduleCommit('offset');
    });
    $('rngLineShift').addEventListener('input', function () {
      Store.state.lineShift = +this.value;
      $('valLineShift').textContent = this.value + '%';
      renderLight(); scheduleCommit('lineShift');
    });
    $('rngQuant').addEventListener('input', function () {
      Store.state.quantize = +this.value;
      $('valQuant').textContent = (+this.value < 2)
        ? (I18N.getLang() === 'zh' ? '关' : 'off') : this.value;
      renderLight(); scheduleCommit('quantize');
    });
    $('chkSkipSpaces').addEventListener('change', function () {
      Store.state.skipSpaces = this.checked; Store.commit('skipSpaces');
    });
    $('chkCompress').addEventListener('change', function () {
      Store.state.compress = this.checked; Store.commit('compress');
    });
  }

  function updateConditional() {
    var st = Store.state;
    $('fieldHue').style.display = (st.space === 'hsl' || st.space === 'hsv') ? '' : 'none';
    $('fieldRepeat').style.display = (st.loop === 'once') ? 'none' : '';
    $('fieldGran').style.display = (st.unit === 'word') ? 'none' : '';
    $('fieldLineShift').style.display = (st.lines === 'shift') ? '' : 'none';
  }

  function syncBgControls() {
    var bg = Store.prefs.bg;
    $('bgColor').hidden = bg !== 'custom';
    $('bgImageBtn').hidden = bg !== 'image';
    $('btnBgClear').hidden = !(bg === 'image' && Store.prefs.bgImage);
  }

  /* 背景图缩到 1000px 宽再存，否则 localStorage 一张图就爆了 */
  function loadBgImage(file) {
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = Math.min(1000, img.width);
        var h = Math.max(1, Math.round(img.height * w / img.width));
        var cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, w, h);

        /* 顺便算个平均色，给可读性检查用 */
        var avg = '#7A7A7A';
        try {
          var d = ctx.getImageData(0, 0, w, h).data, r = 0, g = 0, bl = 0, n = 0;
          for (var i = 0; i < d.length; i += 40) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
          if (n) avg = C.toHex([r / n, g / n, bl / n]);
        } catch (e) { /* 跨域画布，忽略 */ }

        Store.prefs.bgImage = cv.toDataURL('image/jpeg', 0.82);
        Store.prefs.bgAvg = avg;
        Store.prefs.bg = 'image';
        $('selBg').value = 'image';
        /* 存不下也没关系，内存里还在，本次预览照常用 */
        if (!Store.savePrefs()) toast(I18N.t('bg.tooBig'));
        track('bg-image');
        syncBgControls();
        Preview.render(lastBuild, Store.state, Store.prefs);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  function bindPreview() {
    $('selBg').addEventListener('change', function () {
      Store.prefs.bg = this.value;
      Store.savePrefs();
      syncBgControls();
      Preview.render(lastBuild, Store.state, Store.prefs);
      if (this.value === 'image' && !Store.prefs.bgImage) $('bgImage').click();
    });
    $('bgImage').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (f) loadBgImage(f);
      e.target.value = '';
    });
    $('btnBgClear').addEventListener('click', function () {
      Store.prefs.bgImage = '';
      Store.prefs.bg = 'chat';
      $('selBg').value = 'chat';
      Store.savePrefs();
      syncBgControls();
      Preview.render(lastBuild, Store.state, Store.prefs);
    });
    $('bgColor').addEventListener('click', function () {
      var btn = this;
      Picker.open(btn, Store.prefs.bgColor || '#2B2B2B', function (hex) {
        Store.prefs.bgColor = hex;
        btn.style.background = hex;
        btn.title = hex;
        Store.savePrefs();
        Preview.render(lastBuild, Store.state, Store.prefs);
      });
    });
    $('rngScale').addEventListener('input', function () {
      Store.prefs.scale = +this.value;
      Store.savePrefs();
      Preview.render(lastBuild, Store.state, Store.prefs);
    });
    $('chkShadow').addEventListener('change', function () {
      Store.prefs.shadow = this.checked;
      Store.savePrefs();
      Preview.render(lastBuild, Store.state, Store.prefs);
    });
    $('chkAnimObf').addEventListener('change', function () {
      Store.prefs.animObf = this.checked;
      Store.savePrefs();
      Preview.render(lastBuild, Store.state, Store.prefs);
    });
  }

  function bindOutputs() {
    $('outParams').addEventListener('input', function (e) {
      var f = e.target.dataset.param;
      if (!f) return;
      Store.prefs[f] = f === 'miniShort' ? e.target.checked : e.target.value;
      Store.savePrefs();
      renderOutputs();
    });

    $('outTabs').addEventListener('click', function (e) {
      var t = e.target.closest('.tab');
      if (!t) return;
      outGroup = t.dataset.g;
      renderOutTabs(); renderOutParams(); renderOutputs(); renderStats();
    });

    $('outList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) return;
      var box = $('outList').querySelector('[data-id="' + btn.dataset.copy + '"] .out-box');
      if (box) copyText(box.value);
      track('copy-format', { format: btn.dataset.copy, group: outGroup });
    });
  }

  function bindPresets() {
    $('presetTabs').addEventListener('click', function (e) {
      var t = e.target.closest('.tab');
      if (!t) return;
      presetCat = t.dataset.c;
      renderPresetTabs(); renderPresets();
    });

    $('presetGrid').addEventListener('click', function (e) {
      var del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        var id = del.dataset.del;
        var p = Store.getMyPresets().find(function (x) { return x.id === id; });
        if (p && confirm(I18N.t('preset.del', p.name))) {
          Store.removeMyPreset(id);
          renderPresets();
        }
        return;
      }
      var card = e.target.closest('.preset');
      if (!card) return;
      var found = allPresets().find(function (x) { return x.id === card.dataset.p; });
      if (found) {
        applyColors(found.colors);
        track('preset', { preset: found.id, name: found.zh, cat: found.cat });
      }
    });

    $('btnSavePreset').onclick = function () {
      var name = prompt(I18N.t('preset.name'), I18N.getLang() === 'zh' ? '我的渐变' : 'My gradient');
      if (!name) return;
      var cols = Store.state.stops.slice()
        .sort(function (a, b) { return a.pos - b.pos; })
        .map(function (s) { return s.color; });
      Store.addMyPreset(name.slice(0, 30), cols);
      presetCat = 'mine';
      renderPresetTabs(); renderPresets();
      toast(I18N.t('preset.saved'));
      track('save-preset', { stops: cols.length });
    };

    $('btnExport').onclick = function () {
      var blob = new Blob([Store.exportBundle()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'minecraft-gradient.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast(I18N.t('export.done'));
    };

    $('importFile').onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var ok = false;
        try { ok = Store.importBundle(rd.result); } catch (err) { ok = false; }
        if (ok) {
          selStop = 0;
          Store.commit('import');
          syncControls();
          renderPresetTabs(); renderPresets();
          toast(I18N.t('import.done'));
        } else toast(I18N.t('import.fail'));
      };
      rd.readAsText(f);
      e.target.value = '';
    };
  }

  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault(); $('btnUndo').click(); return;
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault(); $('btnRedo').click(); return;
      }
      if (mod && 'biu'.indexOf(e.key.toLowerCase()) >= 0) {
        e.preventDefault();
        toggleStyle({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'r') { e.preventDefault(); randomGradient(); return; }
      if (e.key === 'Escape') $('helpModal').hidden = true;
    });
  }

  /* 把 state / prefs 同步回控件 */
  function syncControls() {
    var st = Store.state, pf = Store.prefs;
    ui.text.value = st.text;
    $('selSpace').value = st.space;
    $('selHue').value = st.hueDir;
    $('selEasing').value = st.easing;
    $('selLoop').value = st.loop;
    $('numRepeats').value = st.repeats;
    $('rngOffset').value = Math.round(st.offset * 100);
    $('valOffset').textContent = Math.round(st.offset * 100) + '%';
    $('selUnit').value = st.unit;
    $('numGran').value = st.gran;
    $('selLines').value = st.lines;
    $('rngLineShift').value = st.lineShift;
    $('valLineShift').textContent = st.lineShift + '%';
    $('chkSkipSpaces').checked = !!st.skipSpaces;
    $('chkCompress').checked = !!st.compress;
    $('rngQuant').value = st.quantize;
    $('valQuant').textContent = st.quantize < 2 ? (I18N.getLang() === 'zh' ? '关' : 'off') : st.quantize;

    $('selBg').value = pf.bg;
    $('bgColor').style.background = pf.bgColor;
    $('bgColor').title = pf.bgColor;
    syncBgControls();
    $('rngScale').value = pf.scale;
    $('chkShadow').checked = !!pf.shadow;
    $('chkAnimObf').checked = !!pf.animObf;

    updateConditional();
    renderOutParams();
    renderAll();
  }

  /* ---------- 语言：正文块切换 + URL 同步（配合 hreflang） ---------- */
  function applyLangBlocks(lang) {
    var zh = $('guideZh'), en = $('guideEn');
    if (zh) zh.hidden = lang !== 'zh';
    if (en) en.hidden = lang !== 'en';
  }

  function syncLangUrl(lang) {
    try {
      var u = new URL(location.href);
      if (lang === 'en') u.searchParams.set('lang', 'en');
      else u.searchParams.delete('lang');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* file:// 下忽略 */ }
  }

  function initialLang() {
    var q;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { q = null; }
    if (q === 'en' || q === 'zh') return q;
    return Store.prefs.lang || 'zh';
  }

  /* ================= 启动 ================= */
  function init() {
    Store.load();
    Store.fromHash();

    document.documentElement.dataset.theme = Store.prefs.theme || 'light';
    $('themeIco').textContent = (document.documentElement.dataset.theme === 'light') ? '☾' : '☀';
    var lang0 = initialLang();
    Store.prefs.lang = lang0;
    I18N.setLang(lang0);
    $('btnLang').textContent = lang0 === 'zh' ? 'EN' : '中';
    applyLangBlocks(lang0);

    Preview.mount($('preview'), $('previewInner'), $('contrast'));
    $('helpBody').innerHTML = I18N.t('help.body');

    bindTopbar();
    bindText();
    bindCharEditor();
    bindGradientBar();
    bindOptions();
    bindPreview();
    bindOutputs();
    bindPresets();
    bindKeys();

    renderPresetTabs();
    renderPresets();
    renderOutTabs();
    renderOutParams();

    Store.on(function () {
      selStop = Math.max(0, Math.min(selStop, Store.state.stops.length - 1));
      renderAll();
    });

    syncControls();
    Store._lastSnap = JSON.stringify({ s: Store.state });
    $('btnUndo').disabled = true;
    $('btnRedo').disabled = true;

    window.addEventListener('hashchange', function () {
      if (Store.fromHash()) { selStop = 0; syncControls(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
