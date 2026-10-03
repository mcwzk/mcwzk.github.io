/* i18n — 中英双语 */
(function (root) {
  'use strict';

  var DICT = {
    zh: {
      'app.title': '我的世界渐变颜色生成器',
      'app.subtitle': 'Hex 渐变 · 全格式输出 · 实时预览',
      'app.seoTitle': '我的世界渐变颜色生成器 - MC 名字/前缀/称号渐变色在线制作',
      'app.seoDesc': '免费的我的世界渐变颜色生成器，输入文字即可生成 MC 渐变名字、聊天、前缀、称号和物品名。支持 MiniMessage、§x 十六进制、&#RRGGBB、tellraw、LuckPerms 前缀等 40 种格式，1.16+ Java 版与基岩版通用，实时预览，一键复制。',

      'btn.undo': '撤销', 'btn.redo': '重做', 'btn.share': '分享链接',
      'tip.undo': '撤销 (Ctrl+Z)', 'tip.redo': '重做 (Ctrl+Y)',

      'sec.text': '文本内容',
      'btn.clearStyles': '清除样式',
      'hint.styleSel': '选中部分文字可只对选区应用样式',

      'sec.charEdit': '逐字精修（单独指定颜色和样式）',
      'hint.charEdit': '点一个字选中它；按住 Shift 选一段；按住 Ctrl 加选。底部有黄条的表示这个字被单独指定了颜色。',
      'btn.charColor': '设为此色', 'btn.charClear': '恢复渐变色',
      'btn.charAll': '全选', 'btn.charNone': '取消选择', 'btn.charResetAll': '清空所有单独设置',
      'char.none': '未选中', 'char.count': '已选 {0} 个字',
      'char.needSel': '请先在上面选中要修改的字',
      'char.cleared': '已清空全部单独设置',

      'sec.gradient': '渐变编辑器',
      'hint.gbar': '双击色条添加色标 · 拖动调整位置 · 右键删除 · 选中后按 ←/→ 微调',
      'btn.addStop': '添加色标', 'btn.distribute': '均匀分布', 'btn.reverse': '反转',
      'btn.random': '随机渐变', 'btn.eyedrop': '屏幕吸管', 'btn.fromImage': '从图片取色',

      'sec.interp': '插值与曲线',
      'lbl.space': '色彩空间', 'lbl.hueDir': '色相绕行', 'lbl.easing': '缓动曲线',
      'lbl.loop': '循环模式', 'lbl.repeats': '循环次数', 'lbl.offset': '相位偏移',
      'space.oklab': 'OKLab（感知均匀 · 推荐）', 'space.lab': 'CIE Lab',
      'space.rgb': 'RGB 线性混合', 'space.srgbLinear': 'sRGB 物理线性',
      'space.hsl': 'HSL', 'space.hsv': 'HSV', 'space.catmull': 'Catmull-Rom 样条',
      'hue.short': '最短路径', 'hue.long': '最长路径', 'hue.cw': '顺时针', 'hue.ccw': '逆时针',
      'ease.linear': '线性', 'ease.in': '缓入', 'ease.out': '缓出', 'ease.inout': '缓入缓出',
      'ease.expo': '指数', 'ease.sine': '正弦', 'ease.step': '阶梯（硬边）',
      'loop.once': '单程', 'loop.bounce': '往返', 'loop.repeat': '重复',

      'sec.granularity': '上色粒度与多行',
      'lbl.unit': '上色单位', 'unit.char': '逐字符', 'unit.word': '逐单词',
      'lbl.gran': '每 N 个字符换色',
      'lbl.multiline': '多行处理',
      'lines.continuous': '全文连续渐变', 'lines.perline': '每行独立渐变', 'lines.shift': '每行递进偏移',
      'lbl.lineShift': '每行偏移',
      'lbl.skipSpaces': '空格不着色（省字符）',
      'lbl.compress': '合并相邻同色（压缩）',
      'lbl.quantize': '颜色数量化',

      'sec.presets': '预设渐变',
      'btn.savePreset': '保存当前为预设', 'btn.export': '导出 JSON', 'btn.import': '导入 JSON',

      'sec.preview': '实时预览',
      'lbl.bg': '背景', 'lbl.scale': '字号', 'lbl.shadow': '文字阴影', 'lbl.animObf': '§k 动画',
      'bg.chat': '聊天框', 'bg.grass': '草地', 'bg.stone': '石头', 'bg.obsidian': '黑曜石',
      'bg.sand': '沙漠', 'bg.nether': '下界', 'bg.white': '纯白',
      'bg.image': '自定义图片', 'bg.custom': '自定义颜色',
      'btn.uploadBg': '上传背景图', 'btn.clearBg': '移除背景图',
      'bg.tooBig': '图片太大存不下，已只用于本次预览',

      'sec.output': '生成结果',
      'lbl.miniShort': 'MiniMessage 用 <gradient> 标签',
      'lbl.cmdTarget': '命令目标', 'lbl.item': '物品 ID',
      'lbl.player': '玩家名', 'lbl.group': '权限组',
      'params.lead': '这些值会填进下面的命令里：',
      'params.none': '这一类不需要额外参数。',

      'foot.note': '渐变计算全部在浏览器本地完成，你输入的文字不会上传。',
      'foot.ylg': 'YLG 服务器相关链接',
      'foot.home': 'YLG服务器入口',
      'foot.whitelist': 'YLG服务器白名单申请',
      'foot.rules': 'YLG服务器规则',
      'foot.forum': 'YLG玩家社区',
      'foot.skin': 'YLGF皮肤站',

      'cat.all': '全部', 'cat.mine': '我的预设',
      'cat.classic': '经典', 'cat.nature': '自然', 'cat.fire': '火焰',
      'cat.cool': '冷色', 'cat.neon': '霓虹', 'cat.rarity': '稀有度',
      'cat.mc': 'MC 主题', 'cat.pastel': '柔和', 'cat.mono': '单色',

      'og.plugin': '颜色代码', 'og.server': '前缀 / 称号 / 插件',
      'og.vanilla': '原版命令', 'og.item': '物品与方块', 'og.web': '站外与工具',

      'stat.chars': '字符', 'stat.colors': '颜色数', 'stat.segments': '色段',
      'stat.lines': '行数',

      'copy.done': '已复制到剪贴板', 'copy.fail': '复制失败，请手动选择',
      'share.done': '分享链接已复制', 'preset.saved': '预设已保存',
      'preset.name': '给这个预设起个名字', 'preset.del': '删除预设「{0}」？',
      'import.done': '导入成功', 'import.fail': '文件格式不正确',
      'export.done': '已导出',
      'random.done': '已生成随机渐变', 'img.done': '已从图片提取 {0} 个颜色',
      'eyedrop.fail': '取色已取消',
      'reset.styles': '已清除全部样式',

      'warn.title': '长度提醒',
      'warn.chat': '聊天消息上限 256 字符 —— {0} 格式已超出（{1}）',
      'warn.team': '记分板队伍前缀上限 16 字符 —— 当前 {0}',
      'warn.anvil': '铁砧改名上限 50 字符 —— 当前 {0}',
      'warn.sign': '告示牌单行建议不超过 15 个可见字符 —— 第 {0} 行有 {1} 个',
      'warn.stops': '至少需要 2 个色标',

      'contrast.label': '在当前背景上的可读性',
      'contrast.good': '清晰', 'contrast.ok': '尚可', 'contrast.low': '偏暗/难辨',
      'contrast.worst': '最差字符对比度 {0}:1',

      'help.title': '使用说明与快捷键',
      'help.body': [
        '<h4>快速上手</h4><ul>',
        '<li>在「文本内容」里输入要显示的字，右侧立刻出现预览。</li>',
        '<li>在「渐变编辑器」的色条上双击可加色标，拖动可改位置，右键删除。</li>',
        '<li>在「生成结果」里找到你需要的格式，点复制按钮即可。</li>',
        '</ul>',
        '<h4>想让某几个字跟别人不一样？</h4><ul>',
        '<li>展开「逐字精修」，点一个字选中，Shift 选一段，Ctrl 加选。</li>',
        '<li>选好后可以单独指定颜色（会盖掉渐变），也可以单独加粗 / 斜体等。</li>',
        '<li>格子底下有黄条的，就是被单独指定过颜色的字。</li>',
        '</ul>',
        '<h4>「玩家名」「权限组」这些框是干嘛的？</h4><ul>',
        '<li>它们会填进下面生成的命令里。比如在「前缀 / 称号 / 插件」里填了玩家名 Notch，',
        'LuckPerms 那条命令就会变成 <code>/lp user Notch meta addprefix …</code>，复制了直接能用。</li>',
        '<li>只有需要用到的分类才会显示对应的框。</li>',
        '</ul>',
        '<h4>该用哪个格式？</h4><ul>',
        '<li><b>MiniMessage</b> — Paper 服务端、以及使用 Adventure 的现代插件。</li>',
        '<li><b>&amp;#RRGGBB</b> — Essentials、大多数常见插件的配置文件里最通用。</li>',
        '<li><b>§x§R§R§G§G§B§B</b> — Spigot 1.16+ 原生 Hex 写法，直接写进代码或部分插件。</li>',
        '<li><b>&amp; 代码（16 色）</b> — 1.15 及以下、基岩版，只能用最接近的 16 种原版颜色。</li>',
        '<li><b>tellraw / title</b> — 纯原版命令方块、数据包。</li>',
        '</ul>',
        '<h4>省字符的技巧</h4><ul>',
        '<li>打开「空格不着色」和「合并相邻同色」。</li>',
        '<li>把「每 N 个字符换色」调到 2~3，肉眼几乎看不出差别，长度能省一半。</li>',
        '<li>用「颜色数量化」把渐变压到十几种颜色。</li>',
        '</ul>',
        '<h4>快捷键</h4><ul>',
        '<li><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> — 撤销 / 重做</li>',
        '<li><kbd>Ctrl</kbd>+<kbd>B</kbd> / <kbd>I</kbd> / <kbd>U</kbd> — 粗体 / 斜体 / 下划线</li>',
        '<li><kbd>Alt</kbd>+<kbd>R</kbd> — 随机渐变</li>',
        '<li><kbd>←</kbd> / <kbd>→</kbd> — 微调选中色标（按住 <kbd>Shift</kbd> 步长更大）</li>',
        '<li><kbd>Delete</kbd> — 删除选中色标</li>',
        '</ul>'
      ].join('')
    },

    en: {
      'app.title': 'Minecraft Gradient Generator',
      'app.subtitle': 'Hex gradients · every format · live preview',
      'app.seoTitle': 'Minecraft Gradient Generator - Hex Colour Names, Prefixes & Tags',
      'app.seoDesc': 'Free Minecraft gradient text generator. Turn any text into a hex colour gradient for names, chat, prefixes, tags and item names. 40 output formats including MiniMessage, §x hex, &#RRGGBB, tellraw and LuckPerms prefixes. Live preview, one-click copy.',

      'btn.undo': 'Undo', 'btn.redo': 'Redo', 'btn.share': 'Share link',
      'tip.undo': 'Undo (Ctrl+Z)', 'tip.redo': 'Redo (Ctrl+Y)',

      'sec.text': 'Text',
      'btn.clearStyles': 'Clear styles',
      'hint.styleSel': 'Select part of the text to style only that range',

      'sec.charEdit': 'Per-character tweaks (own colour & style)',
      'hint.charEdit': 'Click a character to select it; Shift for a range; Ctrl to add. A yellow bar underneath means that character has its own colour.',
      'btn.charColor': 'Set colour', 'btn.charClear': 'Back to gradient',
      'btn.charAll': 'Select all', 'btn.charNone': 'Deselect', 'btn.charResetAll': 'Clear all overrides',
      'char.none': 'nothing selected', 'char.count': '{0} selected',
      'char.needSel': 'Select some characters above first',
      'char.cleared': 'All per-character overrides cleared',

      'sec.gradient': 'Gradient editor',
      'hint.gbar': 'Double-click to add a stop · drag to move · right-click to delete · ←/→ to nudge',
      'btn.addStop': 'Add stop', 'btn.distribute': 'Distribute', 'btn.reverse': 'Reverse',
      'btn.random': 'Randomise', 'btn.eyedrop': 'Screen picker', 'btn.fromImage': 'From image',

      'sec.interp': 'Interpolation & curve',
      'lbl.space': 'Colour space', 'lbl.hueDir': 'Hue path', 'lbl.easing': 'Easing',
      'lbl.loop': 'Loop mode', 'lbl.repeats': 'Cycles', 'lbl.offset': 'Phase offset',
      'space.oklab': 'OKLab (perceptual · recommended)', 'space.lab': 'CIE Lab',
      'space.rgb': 'RGB (simple mix)', 'space.srgbLinear': 'Linear sRGB',
      'space.hsl': 'HSL', 'space.hsv': 'HSV', 'space.catmull': 'Catmull-Rom spline',
      'hue.short': 'Shortest', 'hue.long': 'Longest', 'hue.cw': 'Clockwise', 'hue.ccw': 'Counter-clockwise',
      'ease.linear': 'Linear', 'ease.in': 'Ease in', 'ease.out': 'Ease out', 'ease.inout': 'Ease in-out',
      'ease.expo': 'Exponential', 'ease.sine': 'Sine', 'ease.step': 'Stepped (hard edges)',
      'loop.once': 'Once', 'loop.bounce': 'Bounce', 'loop.repeat': 'Repeat',

      'sec.granularity': 'Granularity & multi-line',
      'lbl.unit': 'Colour unit', 'unit.char': 'Per character', 'unit.word': 'Per word',
      'lbl.gran': 'New colour every N chars',
      'lbl.multiline': 'Multi-line',
      'lines.continuous': 'One gradient across all lines', 'lines.perline': 'Gradient per line',
      'lines.shift': 'Per line, shifted',
      'lbl.lineShift': 'Shift per line',
      'lbl.skipSpaces': 'Leave spaces uncoloured (saves chars)',
      'lbl.compress': 'Merge identical neighbours',
      'lbl.quantize': 'Quantise colours',

      'sec.presets': 'Presets',
      'btn.savePreset': 'Save current', 'btn.export': 'Export JSON', 'btn.import': 'Import JSON',

      'sec.preview': 'Live preview',
      'lbl.bg': 'Background', 'lbl.scale': 'Size', 'lbl.shadow': 'Text shadow', 'lbl.animObf': 'Animate §k',
      'bg.chat': 'Chat box', 'bg.grass': 'Grass', 'bg.stone': 'Stone', 'bg.obsidian': 'Obsidian',
      'bg.sand': 'Desert', 'bg.nether': 'Nether', 'bg.white': 'White',
      'bg.image': 'Custom image', 'bg.custom': 'Custom colour',
      'btn.uploadBg': 'Upload background', 'btn.clearBg': 'Remove background',
      'bg.tooBig': 'Image too large to save — used for this session only',

      'sec.output': 'Output',
      'lbl.miniShort': 'Use <gradient> tag for MiniMessage',
      'lbl.cmdTarget': 'Target', 'lbl.item': 'Item ID',
      'lbl.player': 'Player name', 'lbl.group': 'Permission group',
      'params.lead': 'These values get filled into the commands below:',
      'params.none': 'This category needs no extra parameters.',

      'foot.note': 'Gradients are computed locally in your browser — your text is never uploaded.',
      'foot.ylg': 'YLG Server Links',
      'foot.home': 'YLG Server Home',
      'foot.whitelist': 'YLG Whitelist Application',
      'foot.rules': 'YLG Server Rules',
      'foot.forum': 'YLG Player Community',
      'foot.skin': 'YLGF Skin Site',

      'cat.all': 'All', 'cat.mine': 'Mine',
      'cat.classic': 'Classic', 'cat.nature': 'Nature', 'cat.fire': 'Fire',
      'cat.cool': 'Cool', 'cat.neon': 'Neon', 'cat.rarity': 'Rarity',
      'cat.mc': 'Minecraft', 'cat.pastel': 'Pastel', 'cat.mono': 'Mono',

      'og.plugin': 'Colour codes', 'og.server': 'Prefixes / tags / plugins',
      'og.vanilla': 'Vanilla commands', 'og.item': 'Items & blocks', 'og.web': 'Outside the game',

      'stat.chars': 'chars', 'stat.colors': 'colours', 'stat.segments': 'segments',
      'stat.lines': 'lines',

      'copy.done': 'Copied to clipboard', 'copy.fail': 'Copy failed — select manually',
      'share.done': 'Share link copied', 'preset.saved': 'Preset saved',
      'preset.name': 'Name this preset', 'preset.del': 'Delete preset "{0}"?',
      'import.done': 'Imported', 'import.fail': 'Invalid file',
      'export.done': 'Exported',
      'random.done': 'Random gradient generated', 'img.done': 'Extracted {0} colours',
      'eyedrop.fail': 'Picker cancelled',
      'reset.styles': 'All styles cleared',

      'warn.title': 'Length warnings',
      'warn.chat': 'Chat limit is 256 chars — {0} exceeds it ({1})',
      'warn.team': 'Scoreboard team prefix limit is 16 chars — currently {0}',
      'warn.anvil': 'Anvil rename limit is 50 chars — currently {0}',
      'warn.sign': 'Sign lines should stay under 15 visible chars — line {0} has {1}',
      'warn.stops': 'At least 2 colour stops are required',

      'contrast.label': 'Readability on this background',
      'contrast.good': 'clear', 'contrast.ok': 'okay', 'contrast.low': 'hard to read',
      'contrast.worst': 'worst char contrast {0}:1',

      'help.title': 'How to use & shortcuts',
      'help.body': [
        '<h4>Getting started</h4><ul>',
        '<li>Type your text on the left — the preview updates instantly.</li>',
        '<li>Double-click the gradient bar to add a stop, drag to move, right-click to remove.</li>',
        '<li>Find the format you need under "Output" and hit copy.</li>',
        '</ul>',
        '<h4>Making a few characters different</h4><ul>',
        '<li>Open "Per-character tweaks", click a character, Shift for a range, Ctrl to add.</li>',
        '<li>Give the selection its own colour (overrides the gradient) or its own bold / italic.</li>',
        '<li>A yellow bar under a tile means that character has an override.</li>',
        '</ul>',
        '<h4>What are the "Player name" / "Group" boxes for?</h4><ul>',
        '<li>They get filled into the generated commands. Set the player to Notch and the LuckPerms',
        ' line becomes <code>/lp user Notch meta addprefix …</code> — copy and run it.</li>',
        '<li>Only the boxes a category actually uses are shown.</li>',
        '</ul>',
        '<h4>Which format?</h4><ul>',
        '<li><b>MiniMessage</b> — Paper servers and modern Adventure-based plugins.</li>',
        '<li><b>&amp;#RRGGBB</b> — Essentials and most plugin config files.</li>',
        '<li><b>§x§R§R§G§G§B§B</b> — native Spigot 1.16+ hex, for code and some plugins.</li>',
        '<li><b>&amp; codes (16 colours)</b> — 1.15 and below, and Bedrock: nearest vanilla colour.</li>',
        '<li><b>tellraw / title</b> — pure vanilla command blocks and datapacks.</li>',
        '</ul>',
        '<h4>Saving characters</h4><ul>',
        '<li>Enable "leave spaces uncoloured" and "merge identical neighbours".</li>',
        '<li>Set "new colour every N chars" to 2–3 — nearly invisible, roughly half the length.</li>',
        '<li>Use "quantise colours" to squash the ramp down to a dozen shades.</li>',
        '</ul>',
        '<h4>Shortcuts</h4><ul>',
        '<li><kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> — undo / redo</li>',
        '<li><kbd>Ctrl</kbd>+<kbd>B</kbd> / <kbd>I</kbd> / <kbd>U</kbd> — bold / italic / underline</li>',
        '<li><kbd>Alt</kbd>+<kbd>R</kbd> — random gradient</li>',
        '<li><kbd>←</kbd> / <kbd>→</kbd> — nudge selected stop (<kbd>Shift</kbd> for bigger steps)</li>',
        '<li><kbd>Delete</kbd> — remove selected stop</li>',
        '</ul>'
      ].join('')
    }
  };

  var lang = 'zh';

  function t(key) {
    var s = (DICT[lang] && DICT[lang][key]) || (DICT.zh[key]) || key;
    for (var i = 1; i < arguments.length; i++) {
      s = s.replace('{' + (i - 1) + '}', arguments[i]);
    }
    return s;
  }

  function setLang(l) {
    lang = DICT[l] ? l : 'zh';
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    apply();
  }

  function getLang() { return lang; }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });

    /* 标题和描述跟着语言走，配合 hreflang 才算完整 */
    document.title = t('app.seoTitle');
    setMeta('name', 'description', t('app.seoDesc'));
    setMeta('property', 'og:title', t('app.seoTitle'));
    setMeta('property', 'og:description', t('app.seoDesc'));
    setMeta('property', 'og:locale', lang === 'zh' ? 'zh_CN' : 'en_US');
  }

  function setMeta(attr, key, val) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (el) el.setAttribute('content', val);
  }

  root.I18N = { t: t, setLang: setLang, getLang: getLang, apply: apply };
})(window);
