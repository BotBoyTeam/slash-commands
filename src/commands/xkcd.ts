import needle from 'needle';
import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentType,
  ButtonStyle
} from 'slash-create';
import { randInt } from '../util';

interface XKCDResponse {
  month: string;
  num: number;
  link: string;
  year: string;
  news: string;
  safe_title: string;
  transcript: string;
  alt: string;
  img: string;
  title: string;
  day: string;
}

export default class XKCDCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'xkcd',
      description: 'View XKCD comics.',
      guildIDs: process.env.COMMANDS_DEV_GUILD || [],
      options: [
        {
          type: CommandOptionType.INTEGER,
          name: 'comic',
          description: 'The comic to view, default is latest comic.'
        },
        {
          type: CommandOptionType.BOOLEAN,
          name: 'random',
          description: 'Get a random comic?'
        }
      ],
      throttling: {
        usages: 1,
        duration: 5
      }
    });
  }

  async run(ctx: CommandContext) {
    let num: number = ctx.options.comic;
    if (ctx.options.random) {
      const latestResponse = await needle('get', 'https://xkcd.com/info.0.json');
      num = randInt(1, (latestResponse.body as XKCDResponse).num);
    }
    const url = `https://xkcd.com/${num ? `${num}/` : ''}info.0.json`;
    const response = await needle('get', url);
    const comic = response.body as XKCDResponse;
    const timestamp = Math.floor(
      new Date(parseInt(comic.year), parseInt(comic.month) - 1, parseInt(comic.day)).valueOf() / 1000
    );
    return {
      embeds: [
        {
          title: `${comic.num}: ${comic.title}`,
          url: `http://xkcd.com/${comic.num}`,
          description: `${comic.alt}\n\n<t:${timestamp}:D>`,
          image: {
            url: comic.img
          }
        }
      ],
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'View on XKCD',
              url: `http://xkcd.com/${comic.num}`
            },
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'Explain it!',
              url: `http://www.explainxkcd.com/wiki/index.php/${comic.num}`
            },
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'Link in Comic',
              url: comic.link
            }
          ].filter((btn) => !!btn.url)
        }
      ]
    };
  }
}
