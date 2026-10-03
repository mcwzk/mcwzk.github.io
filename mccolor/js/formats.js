/* formats.js — 所有输出格式 */
(function (root) {
  'use strict';

  var C = root.MCColor, G = root.MCGradient;
  var S = G.S;
  var SECT = '§';

  /* ---------- 通用小工具 ---------- */

  /* 传统格式里的样式码；颜色码会重置样式，所以每次换色都要重发 */
  function legacyStyles(mask, p) {
    var s = '';
    if (mask & S.OBF)    s += p + 'k';
    if (mask & S.BOLD)   s += p + 'l';
    if (mask & S.STRIKE) s += p + 'm';
    if (mask & S.UNDER)  s += p + 'n';
    if (mask & S.ITALIC) s += p + 'o';
    return s;
  }

  /* 命令只能一行，把换行压成空格 */
  function oneLine(s) { return String(s).replace(/\n/g, ' '); }

  /* SNBT 单引号字符串 */
  function snbt(s) {
    return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }

  /* 把色段转成 JSON 文本组件数组 */
  function components(b, opt) {
    opt = opt || {};
    var out = [];
    b.segments.forEach(function (sg) {
      var o = { text: sg.newline ? '\n' : sg.text };
      if (!sg.newline) {
        if (sg.hex) o.color = sg.hex.toLowerCase();
        if (sg.style & S.BOLD)   o.bold = true;
        if (sg.style & S.ITALIC) o.italic = true;
        if (sg.style & S.UNDER)  o.underlined = true;
        if (sg.style & S.STRIKE) o.strikethrough = true;
        if (sg.style & S.OBF)    o.obfuscated = true;
      }
      out.push(o);
    });
    if (!out.length) out.push({ text: '' });
    return out;
  }

  /* 根组件：物品名/Lore 需要 italic:false 去掉原版默认斜体 */
  function rootComponent(b, killItalic) {
    var extra = components(b);
    var r = { text: '' };
    if (killItalic) r.italic = false;
    r.extra = extra;
    return JSON.stringify(r);
  }

  function componentArray(b, killItalic) {
    var arr = components(b);
    if (killItalic) {
      arr = [{ text: '', italic: false }].concat(arr);
    }
    return JSON.stringify(arr);
  }

  /* 按行拆成多个组件数组（告示牌用） */
  function lineComponents(b, killItalic) {
    var lines = [[]], i;
    for (i = 0; i < b.segments.length; i++) {
      if (b.segments[i].newline) { lines.push([]); continue; }
      lines[lines.length - 1].push(b.segments[i]);
    }
    return lines.map(function (segs) {
      var fake = { segments: segs };
      var arr = components(fake);
      if (killItalic) arr = [{ text: '', italic: false }].concat(arr);
      return JSON.stringify(arr);
    });
  }

  /* ---------- 传统 / 插件格式 ---------- */

  function legacyLike(b, mkColor, prefix) {
    var out = '';
    b.segments.forEach(function (sg) {
      if (sg.newline) { out += '\n'; return; }
      if (sg.hex) {
        out += mkColor(C.parseHex(sg.hex), sg.hex);
        out += legacyStyles(sg.style, prefix);
      } else if (sg.style) {
        out += legacyStyles(sg.style, prefix);
      }
      out += sg.text;
    });
    return out;
  }

  function spigotHex(b) {
    return legacyLike(b, function (rgb, hex) {
      var h = hex.replace('#', '').toLowerCase();
      var s = SECT + 'x';
      for (var i = 0; i < 6; i++) s += SECT + h[i];
      return s;
    }, SECT);
  }

  function bungeeHex(b) {
    return legacyLike(b, function (rgb, hex) { return '&' + hex.toUpperCase(); }, '&');
  }

  function nearest16(b, prefix, picker) {
    var out = '', lastCode = null;
    b.segments.forEach(function (sg) {
      if (sg.newline) { out += '\n'; lastCode = null; return; }
      if (sg.hex) {
        var col = picker(C.parseHex(sg.hex));
        /* 同一个 16 色不必重复发码，除非样式需要重置 */
        if (col.code !== lastCode || sg.style) {
          out += prefix + col.code + legacyStyles(sg.style, prefix);
          lastCode = col.code;
        }
      } else if (sg.style) {
        out += legacyStyles(sg.style, prefix);
      }
      out += sg.text;
    });
    return out;
  }

  /* ---------- Discord ANSI ---------- */
  var DISCORD = [
    { c: 30, hex: '#4F545C' }, { c: 31, hex: '#DC322F' }, { c: 32, hex: '#859900' },
    { c: 33, hex: '#B58900' }, { c: 34, hex: '#268BD2' }, { c: 35, hex: '#D33682' },
    { c: 36, hex: '#2AA198' }, { c: 37, hex: '#FFFFFF' }
  ];
  function nearestDiscord(rgb) {
    var best = DISCORD[0], bd = Infinity;
    var t = C.rgbToOklab(rgb);
    DISCORD.forEach(function (d) {
      if (!d._ok) d._ok = C.rgbToOklab(C.parseHex(d.hex));
      var dl = d._ok[0] - t[0], da = d._ok[1] - t[1], db = d._ok[2] - t[2];
      var v = dl * dl + da * da + db * db;
      if (v < bd) { bd = v; best = d; }
    });
    return best.c;
  }

  /* ---------- 格式定义 ---------- */
  /* limit: 超过这个长度就标红 */
  var FORMATS = [

    /* ===== 插件 / 服务器 ===== */
    {
      id: 'minimessage', group: 'plugin', limit: null,
      name: { zh: 'MiniMessage', en: 'MiniMessage' },
      desc: { zh: 'Paper / Adventure 现代插件', en: 'Paper / Adventure plugins' },
      render: function (b, st, o) {
        /* <gradient> 标签模式：简洁但忽略色标位置与缓动 */
        if (o.miniShort) {
          var cols = (st.stops || []).slice().sort(function (a, c) { return a.pos - c.pos; })
            .map(function (s) { return s.color.toUpperCase(); });
          if (cols.length < 2) cols = ['#FFFFFF', '#FFFFFF'];
          var tag = '<gradient:' + cols.join(':') +
            (st.offset ? ':' + st.offset.toFixed(2) : '') + '>';
          var open = '', close = '';
          var m = 0;
          (st.styles) && Object.keys(G.STYLE_KEYS).forEach(function (k) {
            if (st.styles[k]) m |= G.STYLE_KEYS[k];
          });
          if (m & S.BOLD)   { open += '<b>';   close = '</b>' + close; }
          if (m & S.ITALIC) { open += '<i>';   close = '</i>' + close; }
          if (m & S.UNDER)  { open += '<u>';   close = '</u>' + close; }
          if (m & S.STRIKE) { open += '<st>';  close = '</st>' + close; }
          if (m & S.OBF)    { open += '<obf>'; close = '</obf>' + close; }
          return tag + open + esc(st.text) + close + '</gradient>';
        }

        /* 逐段模式：精确还原 */
        var out = '', curStyle = 0;
        b.segments.forEach(function (sg) {
          if (sg.newline) { out += '<newline>'; return; }
          if (sg.hex) out += '<' + sg.hex.toUpperCase() + '>';
          var delta = sg.style ^ curStyle;
          if (delta) {
            [[S.BOLD, 'b'], [S.ITALIC, 'i'], [S.UNDER, 'u'], [S.STRIKE, 'st'], [S.OBF, 'obf']]
              .forEach(function (p) {
                if (delta & p[0]) out += (sg.style & p[0]) ? '<' + p[1] + '>' : '<!' + p[1] + '>';
              });
            curStyle = sg.style;
          }
          out += esc(sg.text);
        });
        return out;

        function esc(s) { return String(s).replace(/</g, '\\<'); }
      }
    },
    {
      id: 'bungee', group: 'plugin', limit: null,
      name: { zh: '&#RRGGBB', en: '&#RRGGBB' },
      desc: { zh: 'Essentials / 多数插件配置文件通用', en: 'Essentials & most plugin configs' },
      render: function (b) { return bungeeHex(b); }
    },
    {
      id: 'spigot', group: 'plugin', limit: 256,
      name: { zh: '§x §R§R§G§G§B§B', en: '§x §R§R§G§G§B§B' },
      desc: { zh: 'Spigot 1.16+ 原生 Hex', en: 'Native Spigot 1.16+ hex' },
      render: function (b) { return spigotHex(b); }
    },
    {
      id: 'spigot-esc', group: 'plugin', limit: null,
      name: { zh: '§x（\\u00A7 转义）', en: '§x (\\u00A7 escaped)' },
      desc: { zh: '写进 Java 代码 / properties 文件', en: 'For Java source & .properties' },
      render: function (b) { return spigotHex(b).replace(/§/g, '\\u00A7'); }
    },
    {
      id: 'amp16', group: 'plugin', limit: null,
      name: { zh: '& 代码（16 色近似）', en: '& codes (16-colour)' },
      desc: { zh: '1.15 及以下 / 老插件', en: '1.15 and below, legacy plugins' },
      render: function (b) { return nearest16(b, '&', C.nearestLegacy); }
    },
    {
      id: 'sect16', group: 'plugin', limit: null,
      name: { zh: '§ 代码（16 色近似）', en: '§ codes (16-colour)' },
      desc: { zh: '直接粘进游戏 / 老服务端', en: 'Paste straight into legacy servers' },
      render: function (b) { return nearest16(b, SECT, C.nearestLegacy); }
    },
    {
      id: 'motd', group: 'plugin', limit: null,
      name: { zh: 'MOTD（server.properties）', en: 'MOTD (server.properties)' },
      desc: { zh: '原版 MOTD 只支持 16 色，已自动转义', en: 'Vanilla MOTD is 16-colour only; escaped' },
      render: function (b) {
        return nearest16(b, SECT, C.nearestLegacy)
          .replace(/§/g, '\\u00A7')
          .replace(/\n/g, '\\n');
      }
    },
    {
      id: 'motd-json', group: 'plugin', limit: null,
      name: { zh: 'MOTD JSON（支持 Hex 的插件）', en: 'MOTD JSON (hex-capable plugins)' },
      desc: { zh: 'ServerListPlus / Advanced MOTD 等', en: 'ServerListPlus, Advanced MOTD…' },
      render: function (b) { return rootComponent(b, false); }
    },

    /* ===== 前缀 / 称号 / 插件命令 ===== */
    {
      id: 'lp-user-prefix', group: 'server', limit: null,
      name: { zh: 'LuckPerms 玩家前缀', en: 'LuckPerms user prefix' },
      desc: { zh: '权重 100，数字越大越优先', en: 'Weight 100 — higher wins' },
      render: function (b, st, o) {
        return '/lp user ' + o.player + ' meta addprefix 100 "' + oneLine(bungeeHex(b)) + '"';
      }
    },
    {
      id: 'lp-user-suffix', group: 'server', limit: null,
      name: { zh: 'LuckPerms 玩家后缀', en: 'LuckPerms user suffix' },
      desc: { zh: '显示在玩家名后面', en: 'Shown after the player name' },
      render: function (b, st, o) {
        return '/lp user ' + o.player + ' meta addsuffix 100 "' + oneLine(bungeeHex(b)) + '"';
      }
    },
    {
      id: 'lp-group-prefix', group: 'server', limit: null,
      name: { zh: 'LuckPerms 权限组前缀', en: 'LuckPerms group prefix' },
      desc: { zh: '整组玩家一起生效', en: 'Applies to the whole group' },
      render: function (b, st, o) {
        return '/lp group ' + o.group + ' meta addprefix 100 "' + oneLine(bungeeHex(b)) + '"';
      }
    },
    {
      id: 'lp-group-suffix', group: 'server', limit: null,
      name: { zh: 'LuckPerms 权限组后缀', en: 'LuckPerms group suffix' },
      desc: { zh: '整组玩家一起生效', en: 'Applies to the whole group' },
      render: function (b, st, o) {
        return '/lp group ' + o.group + ' meta addsuffix 100 "' + oneLine(bungeeHex(b)) + '"';
      }
    },
    {
      id: 'lp-yaml', group: 'server', limit: null,
      name: { zh: 'LuckPerms 配置片段', en: 'LuckPerms YAML snippet' },
      desc: { zh: 'yaml 存储模式下的 groups/<组名>.yml', en: 'groups/<name>.yml under YAML storage' },
      render: function (b, st, o) {
        return 'name: ' + o.group + '\npermissions:\n- prefix.100.' + oneLine(bungeeHex(b));
      }
    },
    {
      id: 'tab', group: 'server', limit: null,
      name: { zh: 'TAB 插件（列表 / 头顶）', en: 'TAB plugin (tablist / nametag)' },
      desc: { zh: 'groups.yml 里的 tabprefix 与 tagprefix', en: 'tabprefix & tagprefix in groups.yml' },
      render: function (b, st, o) {
        var s = oneLine(bungeeHex(b));
        return o.group + ':\n  tabprefix: "' + s + '"\n  tagprefix: "' + s + '"\n  customtabname: "' +
          s + '%player%"';
      }
    },
    {
      id: 'deluxetags', group: 'server', limit: null,
      name: { zh: 'DeluxeTags 称号', en: 'DeluxeTags tag' },
      desc: { zh: 'tags.yml 配置片段', en: 'tags.yml snippet' },
      render: function (b, st, o) {
        return 'gradient:\n  order: 1\n  displaytag: \'' + oneLine(bungeeHex(b)).replace(/'/g, "''") +
          '\'\n  description: \'渐变称号\'\n  permission: deluxetags.tag.gradient';
      }
    },
    {
      id: 'nick', group: 'server', limit: null,
      name: { zh: 'EssentialsX 昵称', en: 'EssentialsX nickname' },
      desc: { zh: '/nick 改名', en: '/nick rename' },
      render: function (b, st, o) {
        return '/nick ' + o.player + ' ' + oneLine(bungeeHex(b));
      }
    },
    {
      id: 'cmi-nick', group: 'server', limit: null,
      name: { zh: 'CMI 昵称', en: 'CMI nickname' },
      desc: { zh: '/cmi nickname', en: '/cmi nickname' },
      render: function (b, st, o) {
        return '/cmi nickname ' + o.player + ' ' + oneLine(bungeeHex(b));
      }
    },
    {
      id: 'team', group: 'server', limit: 16,
      name: { zh: '记分板队伍前缀', en: 'Scoreboard team prefix' },
      desc: { zh: '/team modify — 传统前缀上限 16 字符', en: '/team modify — legacy cap is 16 chars' },
      render: function (b) {
        return '/team modify gradient prefix ' + componentArray(b, false);
      },
      lenOf: function (b) { return oneLine(spigotHex(b)).length; }
    },
    {
      id: 'dh', group: 'server', limit: null,
      name: { zh: 'DecentHolograms 全息字', en: 'DecentHolograms' },
      desc: { zh: '每行文本对应一行全息', en: 'One hologram line per text line' },
      render: function (b, st) {
        var ls = bungeeHex(b).split('\n');
        return '/dh create gradient ' + ls[0] + ls.slice(1).map(function (l) {
          return '\n/dh line add gradient ' + l;
        }).join('');
      }
    },
    {
      id: 'hd', group: 'server', limit: null,
      name: { zh: 'HolographicDisplays 全息字', en: 'HolographicDisplays' },
      desc: { zh: '每行文本对应一行全息', en: 'One hologram line per text line' },
      render: function (b) {
        var ls = bungeeHex(b).split('\n');
        return '/hd create gradient ' + ls[0] + ls.slice(1).map(function (l) {
          return '\n/hd addline gradient ' + l;
        }).join('');
      }
    },
    {
      id: 'npc', group: 'server', limit: null,
      name: { zh: 'Citizens NPC 改名', en: 'Citizens NPC rename' },
      desc: { zh: '先选中 NPC 再执行', en: 'Select the NPC first' },
      render: function (b) { return '/npc rename ' + oneLine(bungeeHex(b)); }
    },
    {
      id: 'mv-alias', group: 'server', limit: null,
      name: { zh: 'Multiverse 世界别名', en: 'Multiverse world alias' },
      desc: { zh: '世界列表里显示的名字', en: 'Name shown in the world list' },
      render: function (b) {
        return '/mv modify set alias ' + oneLine(bungeeHex(b));
      }
    },

    /* ===== 原版命令 ===== */
    {
      id: 'tellraw', group: 'vanilla', limit: null,
      name: { zh: '/tellraw 聊天消息', en: '/tellraw chat' },
      desc: { zh: '命令方块 / 数据包', en: 'Command blocks & datapacks' },
      render: function (b, st, o) {
        return '/tellraw ' + (o.target || '@a') + ' ' + componentArray(b, false);
      }
    },
    {
      id: 'title', group: 'vanilla', limit: null,
      name: { zh: '/title 大标题', en: '/title' },
      desc: { zh: '屏幕中央标题', en: 'Screen title' },
      render: function (b, st, o) {
        var t = o.target || '@a';
        return '/title ' + t + ' title ' + componentArray(b, false);
      }
    },
    {
      id: 'subtitle', group: 'vanilla', limit: null,
      name: { zh: '/title 副标题', en: '/title subtitle' },
      desc: { zh: '需先发送 title 才会显示', en: 'Needs a title command first' },
      render: function (b, st, o) {
        return '/title ' + (o.target || '@a') + ' subtitle ' + componentArray(b, false);
      }
    },
    {
      id: 'actionbar', group: 'vanilla', limit: null,
      name: { zh: '/title actionbar 物品栏上方', en: '/title actionbar' },
      desc: { zh: '快捷栏上方的一行字', en: 'Line above the hotbar' },
      render: function (b, st, o) {
        return '/title ' + (o.target || '@a') + ' actionbar ' + componentArray(b, false);
      }
    },
    {
      id: 'bossbar', group: 'vanilla', limit: null,
      name: { zh: '/bossbar Boss 血条', en: '/bossbar' },
      desc: { zh: '创建 + 设置名称 + 显示', en: 'Create, name and show' },
      render: function (b, st, o) {
        var json = componentArray(b, false);
        return [
          '/bossbar add minecraft:gradient ' + json,
          '/bossbar set minecraft:gradient players ' + (o.target || '@a'),
          '/bossbar set minecraft:gradient visible true'
        ].join('\n');
      }
    },
    {
      id: 'sign', group: 'vanilla', limit: null,
      name: { zh: '告示牌 /setblock', en: 'Sign /setblock' },
      desc: { zh: '每行文本对应牌子的一行（最多 4 行）', en: 'One text line per sign row (max 4)' },
      render: function (b) {
        var msgs = lineComponents(b, false).slice(0, 4);
        while (msgs.length < 4) msgs.push('[""]');
        return '/setblock ~ ~ ~ oak_sign{front_text:{messages:[' +
          msgs.map(snbt).join(',') + ']}}';
      }
    },
    {
      id: 'book', group: 'vanilla', limit: null,
      name: { zh: '成书 /give', en: 'Written book /give' },
      desc: { zh: '1.20.5+ 组件写法', en: '1.20.5+ component syntax' },
      render: function (b, st, o) {
        return '/give ' + (o.target === '@a' ? '@p' : (o.target || '@p')) +
          ' written_book[written_book_content={title:"Gradient",author:"' +
          (o.author || 'Generator') + '",pages:[' + snbt(componentArray(b, false)) + ']}] 1';
      }
    },

    /* ===== 物品与方块 ===== */
    {
      id: 'item-modern', group: 'item', limit: null,
      name: { zh: '物品名（1.20.5+ 组件）', en: 'Item name (1.20.5+)' },
      desc: { zh: 'custom_name，已关闭默认斜体', en: 'custom_name, default italics off' },
      render: function (b, st, o) {
        return '/give ' + (o.target === '@a' ? '@p' : (o.target || '@p')) + ' ' +
          (o.item || 'diamond_sword') + '[custom_name=' + snbt(componentArray(b, true)) + '] 1';
      }
    },
    {
      id: 'item-legacy', group: 'item', limit: null,
      name: { zh: '物品名（1.20.4 及以下 NBT）', en: 'Item name (≤1.20.4 NBT)' },
      desc: { zh: 'display.Name 老写法', en: 'Legacy display.Name' },
      render: function (b, st, o) {
        return '/give ' + (o.target === '@a' ? '@p' : (o.target || '@p')) + ' ' +
          (o.item || 'diamond_sword') + '{display:{Name:' + snbt(componentArray(b, true)) + '}} 1';
      }
    },
    {
      id: 'lore-modern', group: 'item', limit: null,
      name: { zh: '物品描述 Lore（1.20.5+）', en: 'Item lore (1.20.5+)' },
      desc: { zh: '文本每一行对应一行 Lore', en: 'One text line per lore line' },
      render: function (b, st, o) {
        var ls = lineComponents(b, true);
        return '/give ' + (o.target === '@a' ? '@p' : (o.target || '@p')) + ' ' +
          (o.item || 'diamond_sword') + '[lore=[' + ls.map(snbt).join(',') + ']] 1';
      }
    },
    {
      id: 'lore-legacy', group: 'item', limit: null,
      name: { zh: '物品描述 Lore（≤1.20.4）', en: 'Item lore (≤1.20.4)' },
      desc: { zh: 'display.Lore 老写法', en: 'Legacy display.Lore' },
      render: function (b, st, o) {
        var ls = lineComponents(b, true);
        return '/give ' + (o.target === '@a' ? '@p' : (o.target || '@p')) + ' ' +
          (o.item || 'diamond_sword') + '{display:{Lore:[' + ls.map(snbt).join(',') + ']}} 1';
      }
    },
    {
      id: 'anvil', group: 'item', limit: 50,
      name: { zh: '铁砧改名（插件用 §x 串）', en: 'Anvil rename (§x string)' },
      desc: { zh: '上限 50 字符', en: '50-character cap' },
      render: function (b) { return spigotHex(b).replace(/\n/g, ' '); },
      lenOf: function (b) { return spigotHex(b).replace(/\n/g, ' ').length; }
    },

    /* ===== 站外 ===== */
    {
      id: 'bedrock', group: 'web', limit: null,
      name: { zh: '基岩版 § 代码', en: 'Bedrock § codes' },
      desc: { zh: '含材质色 g/h/i/j/m/n/p/q/s/t/u', en: 'Includes material colours g–u' },
      render: function (b) { return nearest16(b, SECT, C.nearestBedrock); }
    },
    {
      id: 'html', group: 'web', limit: null,
      name: { zh: 'HTML', en: 'HTML' },
      desc: { zh: '网页、论坛签名', en: 'Web pages & forum signatures' },
      render: function (b) {
        var out = '';
        b.segments.forEach(function (sg) {
          if (sg.newline) { out += '<br>\n'; return; }
          var css = [];
          if (sg.hex) css.push('color:' + sg.hex);
          if (sg.style & S.BOLD) css.push('font-weight:bold');
          if (sg.style & S.ITALIC) css.push('font-style:italic');
          var dec = [];
          if (sg.style & S.UNDER) dec.push('underline');
          if (sg.style & S.STRIKE) dec.push('line-through');
          if (dec.length) css.push('text-decoration:' + dec.join(' '));
          var txt = sg.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          out += '<span style="' + css.join(';') + '">' + txt + '</span>';
        });
        return out;
      }
    },
    {
      id: 'css', group: 'web', limit: null,
      name: { zh: 'CSS linear-gradient', en: 'CSS linear-gradient' },
      desc: { zh: '把同一条渐变用在网页上', en: 'Same ramp for the web' },
      render: function (b, st) {
        return 'background:' + G.toCss(st.stops, st.space, st.hueDir, 24) + ';';
      }
    },
    {
      id: 'discord', group: 'web', limit: null,
      name: { zh: 'Discord ANSI', en: 'Discord ANSI' },
      desc: { zh: 'Discord 只有 8 种颜色，已取最接近', en: 'Discord has 8 colours; nearest match' },
      render: function (b) {
        var out = '', last = null;
        b.segments.forEach(function (sg) {
          if (sg.newline) { out += '\n'; last = null; return; }
          var bold = (sg.style & S.BOLD) ? '1' : '0';
          if (sg.hex) {
            var key = bold + ';' + nearestDiscord(C.parseHex(sg.hex));
            if (key !== last) { out += '\u001b[' + key + 'm'; last = key; }
          }
          out += sg.text;
        });
        return '```ansi\n' + out + '\u001b[0m\n```';
      }
    },
    {
      id: 'colors', group: 'web', limit: null,
      name: { zh: '颜色数组 JSON', en: 'Colour array (JSON)' },
      desc: { zh: '逐字符的 Hex 列表，给开发者用', en: 'Per-character hex list for devs' },
      render: function (b) {
        var arr = [];
        for (var i = 0; i < b.chars.length; i++) {
          if (b.chars[i] === '\n') continue;
          arr.push(b.colors[i] || null);
        }
        return JSON.stringify(arr);
      }
    },
    {
      id: 'plain', group: 'web', limit: 256,
      name: { zh: '纯文本（无颜色）', en: 'Plain text' },
      desc: { zh: '对照用的原始文本', en: 'The original text, for reference' },
      render: function (b, st) { return st.text; }
    }
  ];

  var GROUPS = ['plugin', 'server', 'vanilla', 'item', 'web'];

  /* 每个分类需要哪些参数字段 */
  var GROUP_FIELDS = {
    plugin: ['miniShort'],
    server: ['player', 'group'],
    vanilla: ['target'],
    item: ['target', 'item'],
    web: []
  };

  root.MCFormats = {
    list: FORMATS,
    groups: GROUPS,
    groupFields: GROUP_FIELDS,
    spigotHex: spigotHex,
    bungeeHex: bungeeHex,
    components: components
  };
})(window);
