import TurndownService from 'turndown';

// NE = Not exact, AP = Almost perfect
export const EMOTICON_MAP = {
  // Screeps
  desktop: '🗄️', // NE

  // Skribblnauts Unlimited
  crystal: '💎', // AP
  notebook: '📗', // AP

  // Lethal League
  switch: ':544860143205089281',
  raptor: ':544859923977207820',
  doombox: ':545963669662466048',
  dicewhat: ':544859727465807873',
  candywhat: ':544859686403440640',
  candysilly: ':544859647593414666',
  candyman: ':543176108183650324',
  latch: ':544859833946472474',
  pack: ':383659083078565889',
  letsroll: ':544859782155075584',
  sonata: ':544860041837281290',
  switchface: ':544860084908326932', // NE

  // BattleBlock Theater
  bbtcat: ':300467474791661569', // NE

  // Garry's Mod
  gmod: ':566703589695815682',
  physgun: ':756143935302140004' // NE
};

export const turndown = new TurndownService({
  hr: '---',
  // @ts-ignore lol
  bulletListMarker: '•'
});

turndown.addRule('underline', {
  filter: 'u',
  replacement: function (content) {
    return '__' + content + '__';
  }
});

turndown.addRule('spoiler', {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.getAttribute('class') === 'bb_spoiler';
  },
  replacement: function (content) {
    return '|| ' + content + ' ||';
  }
});

turndown.addRule('strike', {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.getAttribute('class') === 'bb_strike';
  },
  replacement: function (content) {
    return '~~' + content + '~~';
  }
});

turndown.addRule('img', {
  filter: 'img',
  replacement: function (content, node) {
    // @ts-ignore
    if (node.getAttribute('class') !== 'emoticon') return '';
    // @ts-ignore
    const emoticon = node.getAttribute('alt').slice(1, -1);
    if (emoticon in EMOTICON_MAP) {
      const resolved = EMOTICON_MAP[emoticon];
      if (resolved.startsWith(':')) return `<:_${resolved}>`;
      else return resolved;
    }
    console.log(emoticon);
    return '';
  }
});

turndown.addRule('inlineLink', {
  filter: function (node, options) {
    return options.linkStyle === 'inlined' && node.nodeName === 'A' && !!node.getAttribute('href');
  },

  replacement: function (content, node) {
    // @ts-ignore
    let href = node.getAttribute('href');
    if (href.startsWith('https://steamcommunity.com/linkfilter/?url=')) href = href.slice(43);
    return '[' + content + '](' + href + ')';
  }
});

export const convert = turndown.turndown.bind(turndown);
