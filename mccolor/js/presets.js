/* presets.js — 内置预设渐变库 */
(function (root) {
  'use strict';

  function g(id, zh, en, cat, colors) {
    return { id: id, zh: zh, en: en, cat: cat, colors: colors };
  }

  var PRESETS = [
    /* ---- 经典 ---- */
    g('rainbow',    '彩虹',       'Rainbow',        'classic', ['#FF0000','#FF7F00','#FFFF00','#00FF00','#0000FF','#4B0082','#9400D3']),
    g('rainbow-s',  '柔和彩虹',   'Soft Rainbow',   'classic', ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B983FF']),
    g('sunset',     '日落',       'Sunset',         'classic', ['#FF512F','#F09819','#FFD86F']),
    g('sunrise',    '日出',       'Sunrise',        'classic', ['#0B486B','#F56217','#FFE47A']),
    g('candy',      '糖果',       'Candy',          'classic', ['#FF6FD8','#3813C2']),
    g('peach',      '蜜桃',       'Peach',          'classic', ['#FFB199','#FF0844']),
    g('gold-rush',  '流金',       'Gold Rush',      'classic', ['#F7971E','#FFD200','#FFF8B0']),
    g('silver',     '白银',       'Silver',         'classic', ['#BDC3C7','#FFFFFF','#8E9EAB']),
    g('bw',         '黑白',       'Black & White',  'classic', ['#000000','#FFFFFF']),

    /* ---- 自然 ---- */
    g('ocean',      '深海',       'Deep Ocean',     'nature',  ['#02AAB0','#00CDAC']),
    g('ocean-d',    '海沟',       'Abyss',          'nature',  ['#000046','#1CB5E0']),
    g('forest',     '森林',       'Forest',         'nature',  ['#134E5E','#71B280']),
    g('leaf',       '新叶',       'Fresh Leaf',     'nature',  ['#A8E063','#56AB2F']),
    g('sky',        '晴空',       'Clear Sky',      'nature',  ['#56CCF2','#2F80ED']),
    g('aurora',     '极光',       'Aurora',         'nature',  ['#00C9FF','#92FE9D','#7F7FD5']),
    g('lavender',   '薰衣草',     'Lavender Field', 'nature',  ['#8E2DE2','#C471ED','#F7CE68']),
    g('sakura',     '樱花',       'Cherry Blossom', 'nature',  ['#FFDDE1','#FF9A9E','#EE9CA7']),
    g('desert',     '沙漠',       'Desert',         'nature',  ['#F6D365','#DA9F5B','#8B5A2B']),
    g('glacier',    '冰川',       'Glacier',        'nature',  ['#E0EAFC','#8FD3F4','#4A6FA5']),
    g('moss',       '苔藓',       'Moss',           'nature',  ['#3E5151','#DECBA4']),
    g('autumn',     '深秋',       'Autumn',         'nature',  ['#DAD299','#B0DAB9','#C79081']),

    /* ---- 火焰 ---- */
    g('fire',       '烈焰',       'Fire',           'fire',    ['#FFEE00','#FF7A00','#D31027']),
    g('lava',       '岩浆',       'Lava',           'fire',    ['#FFF200','#FF6A00','#8B0000','#2B0000']),
    g('ember',      '余烬',       'Ember',          'fire',    ['#4A0000','#B21F1F','#FDBB2D']),
    g('inferno',    '炼狱',       'Inferno',        'fire',    ['#000000','#7A0000','#FF4E00','#FFE259']),
    g('blaze',      '烈焰人',     'Blaze',          'fire',    ['#FFF9C4','#FFC400','#FF6D00']),
    g('nether',     '下界',       'Nether',         'fire',    ['#2C0703','#8C1C13','#F05D23']),
    g('soulfire',   '灵魂火',     'Soul Fire',      'fire',    ['#003B46','#07575B','#66A5AD','#C4DFE6']),

    /* ---- 冷色 ---- */
    g('ice',        '寒冰',       'Ice',            'cool',    ['#FFFFFF','#A8EDEA','#4A90E2']),
    g('frost',      '霜冻',       'Frost',          'cool',    ['#E8F0FF','#7FB2F0','#2B4C8C']),
    g('deepsea',    '深渊',       'Deep Sea',       'cool',    ['#001F3F','#003366','#0074D9','#7FDBFF']),
    g('mint',       '薄荷',       'Mint',           'cool',    ['#00F5A0','#00D9F5']),
    g('twilight',   '暮色',       'Twilight',       'cool',    ['#0F2027','#203A43','#2C5364']),
    g('midnight',   '午夜',       'Midnight',       'cool',    ['#020024','#090979','#00D4FF']),
    g('steel',      '钢蓝',       'Steel',          'cool',    ['#485563','#29323C']),

    /* ---- 霓虹 ---- */
    g('cyberpunk',  '赛博朋克',   'Cyberpunk',      'neon',    ['#FF00E4','#00FFF0']),
    g('synthwave',  '蒸汽波',     'Synthwave',      'neon',    ['#FC00FF','#00DBDE','#FEE140']),
    g('vaporwave',  '合成波',     'Vaporwave',      'neon',    ['#FF71CE','#B967FF','#01CDFE','#05FFA1']),
    g('neon-green', '荧光绿',     'Neon Green',     'neon',    ['#00FF87','#60EFFF']),
    g('neon-pink',  '荧光粉',     'Neon Pink',      'neon',    ['#FF0F7B','#F89B29']),
    g('matrix',     '矩阵',       'Matrix',         'neon',    ['#000000','#00FF41','#003B00']),
    g('electric',   '电光',       'Electric',       'neon',    ['#4776E6','#8E54E9','#FF00CC']),
    g('acid',       '酸性',       'Acid',           'neon',    ['#CCFF00','#00FFC8','#FF00A0']),

    /* ---- 稀有度 ---- */
    g('r-common',   '普通',       'Common',         'rarity',  ['#B0B0B0','#FFFFFF']),
    g('r-uncommon', '罕见',       'Uncommon',       'rarity',  ['#1EFF00','#7CFF5C']),
    g('r-rare',     '稀有',       'Rare',           'rarity',  ['#0070DD','#5BC0FF']),
    g('r-epic',     '史诗',       'Epic',           'rarity',  ['#A335EE','#E07BFF']),
    g('r-legend',   '传说',       'Legendary',      'rarity',  ['#FF8000','#FFD100','#FFF3B0']),
    g('r-mythic',   '神话',       'Mythic',         'rarity',  ['#FF0000','#FF7BAC','#FF0080']),
    g('r-divine',   '神圣',       'Divine',         'rarity',  ['#00FFF7','#FFFFFF','#00FFF7']),
    g('r-cursed',   '诅咒',       'Cursed',         'rarity',  ['#3B0A45','#8E2DE2','#1A0022']),

    /* ---- MC 主题 ---- */
    g('mc-grass',   '草方块',     'Grass Block',    'mc',      ['#7CB342','#5D9C33','#8B5A2B']),
    g('mc-diamond', '钻石',       'Diamond',        'mc',      ['#5DECF5','#B2FFFF','#3FA9B0']),
    g('mc-emerald', '绿宝石',     'Emerald',        'mc',      ['#17DD62','#8AFFB0','#0F9647']),
    g('mc-redstone','红石',       'Redstone',       'mc',      ['#FF0000','#8B0000','#FF4444']),
    g('mc-gold',    '金锭',       'Gold Ingot',     'mc',      ['#FCEE4B','#F9B233','#C77B1B']),
    g('mc-netherite','下界合金',  'Netherite',      'mc',      ['#6B5B5B','#443A3B','#2A2223']),
    g('mc-ender',   '末影',       'Ender',          'mc',      ['#0B1E1B','#17E0BA','#0B1E1B']),
    g('mc-amethyst','紫水晶',     'Amethyst',       'mc',      ['#9A5CC6','#D6B8F0','#6A2FA0']),
    g('mc-lapis',   '青金石',     'Lapis',          'mc',      ['#1E3A8A','#3B6FD4','#A9C6FF']),
    g('mc-copper',  '铜锈',       'Oxidised Copper','mc',      ['#C16D4B','#7FBBA0','#4FA88B']),
    g('mc-creeper', '苦力怕',     'Creeper',        'mc',      ['#0DA70B','#054C05','#0DA70B']),
    g('mc-tnt',     'TNT',        'TNT',            'mc',      ['#DB2B1E','#FFFFFF','#DB2B1E']),
    g('mc-end',     '末地',       'The End',        'mc',      ['#E8E6C8','#B3AE7E','#2D2540']),

    /* ---- 柔和 ---- */
    g('p-dream',    '梦境',       'Dream',          'pastel',  ['#FBC2EB','#A6C1EE']),
    g('p-cotton',   '棉花糖',     'Cotton Candy',   'pastel',  ['#FFDEE9','#B5FFFC']),
    g('p-mellow',   '温柔',       'Mellow',         'pastel',  ['#FFF1EB','#ACE0F9']),
    g('p-cream',    '奶油',       'Cream',          'pastel',  ['#FFF6B7','#F6416C']),
    g('p-sage',     '鼠尾草',     'Sage',           'pastel',  ['#D4E7C5','#BFD8AF','#99BC85']),

    /* ---- 单色渐变 ---- */
    g('m-red',      '单色红',     'Mono Red',       'mono',    ['#FFCCCC','#FF0000','#4D0000']),
    g('m-green',    '单色绿',     'Mono Green',     'mono',    ['#CCFFCC','#00CC00','#003300']),
    g('m-blue',     '单色蓝',     'Mono Blue',      'mono',    ['#CCE0FF','#0055FF','#001A4D']),
    g('m-purple',   '单色紫',     'Mono Purple',    'mono',    ['#E6CCFF','#8000FF','#26004D']),
    g('m-gray',     '单色灰',     'Mono Gray',      'mono',    ['#FFFFFF','#808080','#101010'])
  ];

  var CATS = ['all', 'mine', 'classic', 'nature', 'fire', 'cool', 'neon', 'rarity', 'mc', 'pastel', 'mono'];

  root.MCPresets = { list: PRESETS, cats: CATS };
})(window);
