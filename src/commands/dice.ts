import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { randArray, randInt, times } from '../util';

const NEGATIVE_SIDED = [
  '> {{username}} wanted a negative-sided die, which would have ripped space and time itself.',
  '> {{username}} wanted a negative-sided die, which would have ruined the space-time continuum.',
  '> {{username}} wanted a negative-sided die...\n> Something, something, gravity falls.'
];
const ZERO_SIDED = [
  '> {{username}} wanted a 0-sided die, and nothing of value has been lost.',
  '> {{username}} wanted a 0-sided die, and nothing happens.',
  "> {{username}} wanted a 0-sided die, but it's best if you pick a number higher than that.",
  '> {{username}} wanted a 0-sided die, and BotBoy pretends to roll dice.\n> "It\'s **0**!"',
  '> {{username}} wanted a 0-sided die, and BotBoy pretends to roll dice.\n> "It\'s **{{randomNumber}}**!"\n> *What?*'
];
const MAX_SIDED = [
  "> It's best you use a number below 32.",
  "> BotBoy doesn't have a die with that many sides and asks you to use a number below 32.",
  "> BotBoy doesn't have a die with that many sides and rolls a ball.\n> ...",
  '> BotBoy rolls a ball instead.\n> *Uh...*',
  "> BotBoy doesn't have a die with that many sides and rolls a ball.\n> Suddenly, a dog fetches the ball.\n> *Welp...*",
  '> BotBoy doesn\'t have a die with that many sides and rolls a ball.\n> "**{{randomNumber}}**!"\n> *That ball had numbers on it?*'
];
const HIGH_SIDED = ['> BotBoy breaks out the D&D set and rolls dice from it.'];
const MAX_DICE = ['> BotBoy only has 10 dice...', "> BotBoy can't roll that may dice at once!"];
const ZERO_DICE = [
  "> {{username}} didn't wanna roll dice.",
  "> {{username}} didn't want to roll dice.",
  '> BotBoy ignores your request.',
  '> BotBoy rolled 0 dice.',
  '> BotBoy pretends to roll dice.\n> "**0**!"'
];
const ROLLED = [
  '> "**{{number}}**!"',
  '> "And it\'s **{{number}}**!"',
  '> "That\'s adds up to **{{number}}**!"',
  '> "That\'s a **{{number}}**!"',
  '> "It\'s **{{number}}**!"'
];
const GOOD_ROLL = [
  '> "**{{number}}**! Nice!"',
  '> "**{{number}}**! Nice one!"',
  '> "Oooh, a **{{number}}**!"',
  '> "**{{number}}**! Yahtzee!"'
];
const BAD_ROLL = [
  '> "**{{number}}**! Ouch!"',
  '> "**{{number}}**! Oof!"',
  '> "Yikes... A **{{number}}**..."',
  '> "Oh... A **{{number}}**..."',
  '> "It\'s a **{{number}}**..."'
];
const ONE_DIE = ['> A singular die was rolled.', '> A die was rolled.', '> BotBoy rolled a die.'];
const MULTI_DICE = [
  '> Dice rolls onto the floor.',
  '> BotBoy frantically throws dice around.',
  '> BotBoy casually rolls dice.',
  '> BotBoy rolls some dice.',
  "> I hope you aren't gambling..."
];

export default class DiceCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'dice',
      description: 'Roll some dice.',
      guildIDs: process.env.COMMANDS_DEV_GUILD ? [process.env.COMMANDS_DEV_GUILD] : undefined,
      options: [
        {
          type: CommandOptionType.INTEGER,
          name: 'sides',
          description: 'How many sides should each die have?'
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'amount',
          description: 'How many dice should I roll?'
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'extra',
          description: 'How much should be added after rolling?'
        }
      ]
    });
  }

  handlePrompt(prompts: string[], ctx: CommandContext) {
    return {
      content: randArray(prompts)
        .replace(/{{username}}/g, ctx.user.username)
        .replace(/{{randomNumber}}/g, randInt(1, 100).toLocaleString()),
      allowedMentions: {
        roles: false,
        users: false,
        everyone: false
      }
    };
  }

  async run(ctx: CommandContext) {
    let sides: number = ctx.options.sides;
    if (sides === undefined) sides = 6;
    if (sides < 0) return this.handlePrompt(NEGATIVE_SIDED, ctx);
    if (sides === 0) return this.handlePrompt(ZERO_SIDED, ctx);
    if (sides > 32) return this.handlePrompt(MAX_SIDED, ctx);

    let diceNumber: number = ctx.options.amount;
    if (diceNumber === undefined || diceNumber < 0) diceNumber = 1;
    if (diceNumber === 0) return this.handlePrompt(ZERO_DICE, ctx);
    else if (diceNumber > 10) return this.handlePrompt(MAX_DICE, ctx);

    const dice = times(diceNumber, () => randInt(1, sides));
    const totalNumber = dice.reduce((prev, val) => prev + val, 0);
    const resultNumber = totalNumber + (ctx.options.extra || 0);
    const maxNumber = diceNumber * sides;
    const thirdOfMax = maxNumber / 3;

    const firstLines = [...(dice.length === 1 ? ONE_DIE : MULTI_DICE)];
    const secondLines = [...ROLLED];
    const thirdLine = `> *(out of ${maxNumber}${dice.length > 1 ? `, [${dice.join(', ')}]` : ''}${
      ctx.options.extra !== undefined && ctx.options.extra !== 0
        ? `, ${totalNumber.toLocaleString()} ${ctx.options.extra > 0 ? '+' : '-'} ${Math.abs(
            ctx.options.extra
          ).toLocaleString()}`
        : ''
    })*`;

    if (sides > 10) firstLines.push(...HIGH_SIDED);
    if (totalNumber > thirdOfMax * 2) secondLines.push(...GOOD_ROLL);
    else if (totalNumber <= thirdOfMax) secondLines.push(...BAD_ROLL);

    return {
      content: [randArray(firstLines), randArray(secondLines), thirdLine]
        .join('\n')
        .replace(/{{username}}/g, ctx.user.username)
        .replace(/{{number}}/g, resultNumber),
      allowedMentions: {
        roles: false,
        users: false,
        everyone: false
      }
    };
  }
}
