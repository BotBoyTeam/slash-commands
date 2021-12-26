import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { randArray, randInt, times } from '../util';

/* #region emojify */
const EMOJIFY_MAP: Record<string, string> = {
  '0': ':zero:',
  '1': ':one:',
  '2': ':two:',
  '3': ':three:',
  '4': ':four:',
  '5': ':five:',
  '6': ':six:',
  '7': ':seven:',
  '8': ':eight:',
  '9': ':nine:',
  '>': ':arrow_forward:',
  '<': ':arrow_backward:',
  '#': ':hash:',
  '*': ':asterisk:',
  '?': ':grey_question:',
  '!': ':grey_exclamation:',
  ' ': '   '
};
/* #endregion */

/* #region fancytext */
const FANCY_PRIMER = 55349;
const FANCY_STYLES = [
  {
    title: 'Monospace',
    ranges: [
      {
        index: 0,
        offset: 56944
      },
      {
        index: 1,
        offset: 56970
      },
      {
        index: 2,
        offset: 57334
      }
    ]
  },
  {
    title: 'Bold',
    ranges: [
      {
        index: 0,
        offset: 56788
      },
      {
        index: 1,
        offset: 56814
      },
      {
        index: 2,
        offset: 57324
      }
    ]
  },
  {
    title: 'Thin',
    ranges: [
      {
        index: 0,
        offset: 56736
      },
      {
        index: 1,
        offset: 56762
      },
      {
        index: 2,
        offset: 57314
      }
    ]
  },
  {
    title: 'Bold and Italic',
    ranges: [
      {
        index: 0,
        offset: 56892
      },
      {
        index: 1,
        offset: 56918
      }
    ]
  },
  {
    title: 'Thin and Italic',
    ranges: [
      {
        index: 0,
        offset: 56840
      },
      {
        index: 1,
        offset: 56866
      }
    ]
  },
  {
    title: 'Bold (Monospace)',
    ranges: [
      {
        index: 0,
        offset: 56320
      },
      {
        index: 1,
        offset: 56346
      },
      {
        index: 2,
        offset: 57294
      }
    ]
  },
  {
    title: 'Italic (Monospace)',
    ranges: [
      {
        index: 0,
        offset: 56372
      },
      {
        index: 1,
        offset: 56398
      }
    ]
  },
  {
    title: 'Bold and Italic (Monospace)',
    ranges: [
      {
        index: 0,
        offset: 56424
      },
      {
        index: 1,
        offset: 56450
      }
    ]
  },
  {
    title: 'Script',
    mayNotBeSupported: true,
    ranges: [
      {
        index: 0,
        offset: 56580
      },
      {
        index: 1,
        offset: 56606
      }
    ]
  },
  {
    title: 'Bold Script',
    ranges: [
      {
        index: 0,
        offset: 56684
      },
      {
        index: 1,
        offset: 56710
      }
    ]
  },
  {
    title: 'Cursive',
    mayNotBeSupported: true,
    ranges: [
      {
        index: 0,
        offset: 56476
      },
      {
        index: 1,
        offset: 56502
      }
    ]
  },
  {
    title: 'Bold Cursive',
    ranges: [
      {
        index: 0,
        offset: 56528
      },
      {
        index: 1,
        offset: 56554
      }
    ]
  },
  {
    title: 'Outlined',
    mayNotBeSupported: true,
    ranges: [
      {
        index: 0,
        offset: 56632
      },
      {
        index: 1,
        offset: 56658
      }
    ]
  }
];
const FANCY_RANGES = [
  // A-Z
  [65, 91],
  // a-z
  [97, 123],
  // 0-9
  [48, 58]
];

function inRangeIndex(code: number) {
  return FANCY_RANGES.indexOf(FANCY_RANGES.find((range) => range[0] <= code && range[1] >= code));
}
/* #endregion */

/* #region leetify */
const LEETIFY_MAP = {
  a: '4',
  b: 'B',
  e: '3',
  i: '1',
  o: '0',
  s: '5',
  t: '7'
};
/* #endregion */

/* #region owoify */
const OWOIFY_FACES = ['(・`ω´・)', ';;w;;', 'owo', 'UwU', '>w<', '^w^'];
/* #endregion */

/* #region pirate */
const PIRATE_DICT: Record<string, string> = {
  address: "port o' call",
  admin: 'helm',
  am: 'be',
  an: 'a',
  and: "n'",
  are: 'be',
  award: 'prize',
  bathroom: 'head',
  beer: 'grog',
  before: 'afore',
  belief: 'creed',
  between: 'betwixt',
  big: 'vast',
  bill: 'coin',
  bills: 'coins',
  boss: 'admiral',
  bourbon: 'rum',
  box: 'barrel',
  boy: 'lad',
  buddy: 'mate',
  business: 'company',
  businesses: 'companies',
  calling: "callin'",
  canada: 'Great North',
  cash: 'coin',
  cat: 'parrot',
  cheat: 'hornswaggle',
  comes: 'hails',
  comments: 'yer words',
  cool: 'shipshape',
  country: 'land',
  dashboard: 'shanty',
  dead: "in Davy Jones's Locker",
  disconnect: 'keelhaul',
  do: "d'",
  dog: 'parrot',
  dollar: 'doubloon',
  dollars: 'doubloons',
  dude: 'pirate',
  employee: 'crew',
  everyone: 'all hands',
  eye: 'eye-patch',
  family: 'kin',
  fee: 'debt',
  female: 'wench',
  females: 'wenches',
  food: 'grub',
  for: 'fer',
  friend: 'mate',
  // friend: 'shipmate',
  friends: 'crew',
  fuck: 'shiver me timbers',
  gin: 'rum',
  girl: 'lass',
  girls: 'lassies',
  go: 'sail',
  good: 'jolly good',
  grave: "Davy Jones's Locker",
  group: 'maties',
  gun: 'bluderbuss',
  haha: 'yo ho',
  hahaha: 'yo ho ho',
  hahahaha: 'yo ho ho ho',
  hand: 'hook',
  happy: 'grog-filled',
  hello: 'ahoy',
  hey: 'ahoy',
  hi: 'ahoy',
  hotel: 'fleebag inn',
  i: 'me',
  "i'm": 'i be',
  internet: "series o' tubes",
  invalid: 'sunk',
  is: 'be',
  island: 'isle',
  "isn't": 'be not',
  "it's": "'tis",
  jail: 'brig',
  kill: 'keelhaul',
  king: 'king',
  ladies: 'lasses',
  lady: 'lass',
  lawyer: 'scurvy land lubber',
  left: 'port',
  leg: 'peg',
  logout: 'walk the plank',
  lol: 'blimey',
  male: 'pirate',
  man: 'pirate',
  manager: 'admiral',
  money: 'doubloons',
  month: 'moon',
  my: 'me',
  never: 'nary',
  no: 'nay',
  not: 'nay',
  of: "o'",
  old: 'barnacle-covered',
  omg: 'shiver me timbers',
  over: "o'er",
  page: 'parchment',
  people: 'scallywags',
  person: 'scurvy dog',
  posted: 'tacked to the yardarm',
  president: 'king',
  prison: 'brig',
  quickly: 'smartly',
  really: 'verily',
  relative: 'kin',
  relatives: 'kin',
  religion: 'creed',
  restaurant: 'galley',
  right: 'starboard',
  rotf: "rollin' on the decks",
  say: 'cry',
  seconds: "ticks o' tha clock",
  shipping: 'cargo',
  shit: 'shiver me timbers',
  small: 'puny',
  snack: 'grub',
  soldier: 'sailor',
  sorry: 'yarr',
  spouse: "ball 'n' chain",
  state: 'land',
  supervisor: "Cap'n",
  "that's": 'that be',
  the: 'thar',
  theif: 'swoggler',
  them: "'em",
  this: 'dis',
  to: "t'",
  together: "t'gether",
  treasure: 'booty',
  vodka: 'rum',
  was: 'be',
  water: 'grog',
  we: 'our jolly crew',
  "we're": "we's",
  whiskey: 'rum',
  whisky: 'rum',
  wine: 'grog',
  with: "wit'",
  woman: 'comely wench',
  women: 'beauties',
  work: 'duty',
  yah: 'aye',
  yeah: 'aye',
  yes: 'aye',
  you: 'ye',
  "you're": 'you be',
  "you've": 'ye',
  your: 'yer',
  yup: 'aye'
};

function translateWord(word) {
  var pirateWord = PIRATE_DICT[word.toLowerCase()];
  if (pirateWord === undefined) return word;
  else return applyCase(word, pirateWord);
}

// Take the case from wordA and apply it to wordB
function applyCase(wordA: string, wordB: string) {
  // Exception to avoid words like "I" being converted to "ME"
  if (wordA.length === 1 && wordB.length !== 1) return wordB;
  // Uppercase
  if (wordA === wordA.toUpperCase()) return wordB.toUpperCase();
  // Lowercase
  if (wordA === wordA.toLowerCase()) return wordB.toLowerCase();
  // Capitialized
  var firstChar = wordA.slice(0, 1);
  var otherChars = wordA.slice(1);
  if (firstChar === firstChar.toUpperCase() && otherChars === otherChars.toLowerCase()) {
    return wordB.slice(0, 1).toUpperCase() + wordB.slice(1).toLowerCase();
  }
  // Other cases
  return wordB;
}

function isLetter(character: string) {
  if (character.search(/[a-zA-Z'-]/) === -1) return false;
  return true;
}
/* #endregion */

/* #region vaporwave */
const VAPORWAVE_JP_UNICODE_RANGES = [
  // Hiragana
  [12353, 12438],
  // Katakana
  [12449, 12538],
  // Katakana Phonetic Extensions
  [12784, 12799]
];
const VAPORWAVE_SPECIAL_MAP = {
  // Pound Sign
  163: 65505,
  // Cent
  162: 65504,
  // Yen
  165: 65509,
  // Won Sign
  8361: 65510
};

function getRandomJPUnicode(amount = 1) {
  // @ts-ignore
  return times(amount, () => String.fromCharCode(randInt(...randArray(VAPORWAVE_JP_UNICODE_RANGES)))).join('');
}
/* #endregion */

/* #region zalgo */
const ZALGO_CHARS = {
  ABOVE: [
    '\u0300',
    '\u0301',
    '\u0302',
    '\u0303',
    '\u0304',
    '\u0305',
    '\u0306',
    '\u0307',
    '\u0308',
    '\u0309',
    '\u030A',
    '\u0361',
    '\u030B',
    '\u030C',
    '\u030D',
    '\u030E',
    '\u030F',
    '\u0310',
    '\u0311',
    '\u0312',
    '\u0313',
    '\u0314',
    '\u0315',
    '\u031A',
    '\u031B',
    '\u033D',
    '\u033E',
    '\u033F',
    '\u0340',
    '\u0341',
    '\u0342',
    '\u0343',
    '\u0344',
    '\u0346',
    '\u034A',
    '\u034B',
    '\u034C',
    '\u0350',
    '\u0351',
    '\u0352',
    '\u0357',
    '\u0358',
    '\u035B',
    '\u035D',
    '\u035E',
    '\u0360'
  ],
  BELOW: [
    '\u0316',
    '\u0317',
    '\u0318',
    '\u0319',
    '\u031C',
    '\u031D',
    '\u031E',
    '\u031F',
    '\u0320',
    '\u0321',
    '\u0322',
    '\u0323',
    '\u0324',
    '\u0325',
    '\u0326',
    '\u0327',
    '\u0328',
    '\u0329',
    '\u032A',
    '\u032B',
    '\u032C',
    '\u032D',
    '\u032E',
    '\u032F',
    '\u0330',
    '\u0331',
    '\u0332',
    '\u0333',
    '\u0339',
    '\u033A',
    '\u033B',
    '\u033C',
    '\u0345',
    '\u0347',
    '\u0348',
    '\u0349',
    '\u034D',
    '\u034E',
    '\u0353',
    '\u0354',
    '\u0355',
    '\u0356',
    '\u0359',
    '\u035A',
    '\u035C',
    '\u035F',
    '\u0362'
  ],
  OVERLAY: ['\u0334', '\u0335', '\u0336', '\u0337', '\u0338']
};
/* #endregion */

export default class TextCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'text',
      description: 'Tranform text.',
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'clappify',
          description: 'Clap around your sentences.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'emojify',
          description: 'Turn sentences into a lot of emojis.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'fancy',
          description: 'Make some fancy text (𝙡𝙞𝙠𝙚 𝙩𝙝𝙞𝙨)',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            },
            {
              type: CommandOptionType.INTEGER,
              name: 'style',
              description: 'The style of text to use.',
              choices: [
                {
                  name: 'Monospace (𝚊𝚋𝚌)',
                  value: 0
                },
                {
                  name: 'Bold (𝗮𝗯𝗰)',
                  value: 1
                },
                {
                  name: 'Thin (𝖺𝖻𝖼)',
                  value: 2
                },
                {
                  name: 'Bold + Italic (𝙖𝙗𝙘)',
                  value: 3
                },
                {
                  name: 'Thin + Italic (𝘢𝘣𝘤)',
                  value: 4
                },
                {
                  name: 'Bold + Monospace (𝐚𝐛𝐜)',
                  value: 5
                },
                {
                  name: 'Italic + Monospace (𝑎𝑏𝑐)',
                  value: 6
                },
                {
                  name: 'Bold + Italic + Monospace (𝒂𝒃𝒄)',
                  value: 7
                },
                {
                  name: 'Script (𝔞𝔟𝔠)',
                  value: 8
                },
                {
                  name: 'Script + Bold (𝖆𝖇𝖈)',
                  value: 9
                },
                {
                  name: 'Cursive (𝒶𝒷𝒸)',
                  value: 10
                },
                {
                  name: 'Cursive + Bold (𝓪𝓫𝓬)',
                  value: 11
                },
                {
                  name: 'Outlined (𝕒𝕓𝕔)',
                  value: 12
                }
              ]
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'leetify',
          description: 'What year is this...?',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'owoify',
          description: 'Uh... Ok.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'pirate',
          description: 'Speak like a pirate! Arr!',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'reverse',
          description: '.txet emos esreveR',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'vaporwave',
          description: "Now that's what I call aesthetics.",
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'zalgo',
          description: 'Creepy...',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'text',
              description: 'The text to transform.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'lenny',
          description: '( ͡° ͜ʖ ͡°)'
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    const subcommandTransforms: Record<string, string | ((text: string, ctx: CommandContext) => string)> = {
      clappify: (text) => text.split(' ').join('👏') + '👏',
      emojify: (text) =>
        text
          .split('')
          .map((char) => EMOJIFY_MAP[char] || (/^[a-z]$/i.test(char) ? `:regional_indicator_${char}:` : char))
          .join(' '),
      fancy: (text, ctx) => {
        const style = FANCY_STYLES[ctx.options.fancy.style] || FANCY_STYLES[0];
        return text
          .split('')
          .map((char) => {
            const code = char.charCodeAt(0);
            const rangeIndex = inRangeIndex(code);
            const range = style.ranges.find((range) => range.index === rangeIndex);
            if (range) {
              return String.fromCharCode(FANCY_PRIMER, code - FANCY_RANGES[rangeIndex][0] + range.offset);
            } else return char;
          })
          .join('');
      },
      leetify: (text) =>
        ':robot: ' +
        text
          .split('')
          .map((char) => LEETIFY_MAP[char] || char.toUpperCase())
          .join(''),
      owoify: (text) =>
        '`OwO`: ' +
        text
          .replace(/(?:r|l)/g, 'w')
          .replace(/(?:R|L)/g, 'W')
          .replace(/n([aeiou])/g, 'ny$1')
          .replace(/N([aeiou])/g, 'Ny$1')
          .replace(/N([AEIOU])/g, 'Ny$1')
          .replace(/ove/g, 'uv')
          .replace(/!+/g, ' ' + randArray(OWOIFY_FACES) + ' '),
      pirate: (text) => {
        var translatedText = '';

        // Loop through the text, one character at a time.
        var word = '';
        for (var i = 0; i < text.length; i += 1) {
          var character = text[i];
          // If the char is a letter, then we are in the middle of a word, so we
          // should accumulate the letter into the word variable
          if (isLetter(character)) {
            word += character;
          }
          // If the char is not a letter, then we hit the end of a word, so we
          // should translate the current word and add it to the translation
          else {
            if (word != '') {
              // If we've just finished a word, translate it
              var pirateWord = translateWord(word);
              translatedText += pirateWord;
              word = '';
            }
            translatedText += character; // Add the non-letter character
          }
        }

        // If we ended the loop before translating a word, then translate the final
        // word and add it to the translation.
        if (word !== '') translatedText += translateWord(word);

        return ':pirate_flag: ' + translatedText;
      },
      reverse: (text) => ':leftwards_arrow_with_hook: ' + text.split('').reverse().join(''),
      vaporwave: (text) =>
        text
          .split('')
          .map((char) => {
            const code = char.charCodeAt(0);
            return code >= 33 && code <= 126
              ? String.fromCharCode(code - 33 + 65281)
              : VAPORWAVE_SPECIAL_MAP[code] || char;
          })
          .join('') + ` \`${getRandomJPUnicode(3)}\``,
      zalgo: (text) =>
        text
          .split('')
          .map((char) => {
            if (char !== ' ') {
              times(randInt(5, 7), () => (char += randArray(ZALGO_CHARS.ABOVE)));
              times(randInt(5, 7), () => (char += randArray(ZALGO_CHARS.BELOW)));
              times(randInt(0, 2), () => (char += randArray(ZALGO_CHARS.OVERLAY)));
              return char;
            } else return char;
          })
          .join(''),
      lenny: '( ͡° ͜ʖ ͡°)'
    };

    if (ctx.subcommands[0] in subcommandTransforms) {
      const transform = subcommandTransforms[ctx.subcommands[0]];
      if (typeof transform === 'string')
        return {
          content: transform,
          allowedMentions: {
            roles: false,
            users: false,
            everyone: false
          }
        };
      else {
        const text = transform(ctx.options[ctx.subcommands[0]].text, ctx);
        if (text.length >= 2000) {
          await ctx.send({
            file: {
              name: ctx.subcommands[0] + '.txt',
              file: Buffer.from(text)
            }
          });
          return;
        } else
          return {
            content: text,
            allowedMentions: {
              roles: false,
              users: false,
              everyone: false
            }
          };
      }
    } else
      return {
        content: 'Unknown subcommand.',
        ephemeral: true
      };
  }
}
