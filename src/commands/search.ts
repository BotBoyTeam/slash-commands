import {
  ImageColor,
  ImageLayout,
  ImageLicense,
  ImageSize,
  ImageType,
  SafeSearchType,
  search,
  searchImages,
  SearchTimeType
} from 'duck-duck-scrape';
import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ApplicationCommandOptionChoice,
  ComponentType,
  ButtonStyle
} from 'slash-create';
import { getVQD } from '../interfaces/ddg';
import { decode } from 'html-entities';
import { cutoffText } from '../util';

const SafeSearchChoices: ApplicationCommandOptionChoice[] = [
  {
    name: 'Strict',
    value: SafeSearchType.STRICT
  },
  {
    name: 'Moderate',
    value: SafeSearchType.MODERATE
  },
  {
    name: 'Off',
    value: SafeSearchType.OFF
  }
];

const MinimumSafeSearchChoices: ApplicationCommandOptionChoice[] = [
  {
    name: 'Strict',
    value: SafeSearchType.STRICT
  },
  {
    name: 'Off',
    value: SafeSearchType.OFF
  }
];

export default class SearchCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'search',
      description: 'Search with DuckDuckGo.',
      guildIDs: process.env.COMMANDS_DEV_GUILD || [],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'web',
          description: 'Search the web with DuckDuckGo.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'query',
              description: 'The query to search.',
              required: true
            },
            {
              type: CommandOptionType.INTEGER,
              name: 'safesearch',
              description:
                'The Safe Search setting for the search. Strict by default, non-strict searches are ephemeral.',
              choices: SafeSearchChoices
            },
            {
              type: CommandOptionType.STRING,
              name: 'time',
              description: 'The time range of the searches to use.',
              choices: [
                {
                  name: 'All',
                  value: SearchTimeType.ALL
                },
                {
                  name: 'Last Day',
                  value: SearchTimeType.DAY
                },
                {
                  name: 'Last Week',
                  value: SearchTimeType.WEEK
                },
                {
                  name: 'Last Month',
                  value: SearchTimeType.MONTH
                },
                {
                  name: 'Last Year',
                  value: SearchTimeType.YEAR
                }
              ]
            },
            {
              type: CommandOptionType.BOOLEAN,
              name: 'ephemeral',
              description: 'Whether to only show results to you.'
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'images',
          description: 'Search images with DuckDuckGo.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'query',
              description: 'The query to search.',
              required: true
            },
            {
              type: CommandOptionType.INTEGER,
              name: 'safesearch',
              description:
                'The Safe Search setting for the search. Strict by default, non-strict searches are ephemeral.',
              choices: MinimumSafeSearchChoices
            },
            {
              type: CommandOptionType.STRING,
              name: 'size',
              description: 'The size filter of the images to search.',
              choices: [
                {
                  name: 'All',
                  value: ImageSize.ALL
                },
                {
                  name: 'Small (< 200px)',
                  value: ImageSize.SMALL
                },
                {
                  name: 'Medium (200px - 500px)',
                  value: ImageSize.MEDIUM
                },
                {
                  name: 'Large (500px - 2000px)',
                  value: ImageSize.LARGE
                },
                {
                  name: 'Wallpaper (> 1200px)',
                  value: ImageSize.WALLPAPER
                }
              ]
            },
            {
              type: CommandOptionType.STRING,
              name: 'type',
              description: 'The type of the images to search.',
              choices: [
                {
                  name: 'Any',
                  value: ImageType.ALL
                },
                {
                  name: 'Photo',
                  value: ImageType.PHOTOGRAPH
                },
                {
                  name: 'Clipart',
                  value: ImageType.CLIPART
                },
                {
                  name: 'GIF',
                  value: ImageType.GIF
                },
                {
                  name: 'Transparent',
                  value: ImageType.TRANSPARENT
                }
              ]
            },
            {
              type: CommandOptionType.STRING,
              name: 'layout',
              description: 'The layout of the images to search.',
              choices: [
                {
                  name: 'Any',
                  value: ImageLayout.ALL
                },
                {
                  name: 'Square',
                  value: ImageLayout.SQUARE
                },
                {
                  name: 'Tall',
                  value: ImageLayout.TALL
                },
                {
                  name: 'Wide',
                  value: ImageLayout.WIDE
                }
              ]
            },
            {
              type: CommandOptionType.STRING,
              name: 'color',
              description: 'The color filter of the images to search.',
              choices: [
                {
                  name: 'Any',
                  value: ImageColor.ALL
                },
                {
                  name: 'Any with Color',
                  value: ImageColor.COLOR
                },
                {
                  name: 'Monochrome',
                  value: ImageColor.BLACK_AND_WHITE
                },
                {
                  name: 'Red',
                  value: ImageColor.RED
                },
                {
                  name: 'Orange',
                  value: ImageColor.ORANGE
                },
                {
                  name: 'Yellow',
                  value: ImageColor.YELLOW
                },
                {
                  name: 'Green',
                  value: ImageColor.GREEN
                },
                {
                  name: 'Blue',
                  value: ImageColor.BLUE
                },
                {
                  name: 'Pink',
                  value: ImageColor.PINK
                },
                {
                  name: 'Brown',
                  value: ImageColor.BROWN
                },
                {
                  name: 'Black',
                  value: ImageColor.BLACK
                },
                {
                  name: 'Gray',
                  value: ImageColor.GRAY
                },
                {
                  name: 'Teal',
                  value: ImageColor.TEAL
                },
                {
                  name: 'White',
                  value: ImageColor.WHITE
                }
              ]
            },
            {
              type: CommandOptionType.STRING,
              name: 'license',
              description: 'The license of the images to search.',
              choices: [
                {
                  name: 'Any',
                  value: ImageLicense.ALL
                },
                {
                  name: 'Creative Commons',
                  value: ImageLicense.CREATIVE_COMMONS
                },
                {
                  name: 'Public Domain',
                  value: ImageLicense.PUBLIC_DOMAIN
                },
                {
                  name: 'Free to share',
                  value: ImageLicense.SHARE
                },
                {
                  name: 'Free to share commercially',
                  value: ImageLicense.SHARE_COMMERCIALLY
                },
                {
                  name: 'Free to modify',
                  value: ImageLicense.MODIFY
                },
                {
                  name: 'Free to modify commercially',
                  value: ImageLicense.MODIFY_COMMERCIALLY
                }
              ]
            },
            {
              type: CommandOptionType.BOOLEAN,
              name: 'ephemeral',
              description: 'Whether to only show results to you.'
            }
          ]
        }
      ],
      throttling: {
        usages: 1,
        duration: 10
      }
    });
  }

  async run(ctx: CommandContext) {
    if (ctx.subcommands[0] === 'web') return this.searchWeb(ctx);
    if (ctx.subcommands[0] === 'images') return this.searchImages(ctx);

    return {
      content: 'Unknown subcommand.',
      ephemeral: true
    };
  }

  async searchWeb(ctx: CommandContext) {
    const ephemeral =
      ctx.options.web.ephemeral ||
      (ctx.options.web.safesearch !== undefined && ctx.options.web.safesearch !== SafeSearchType.STRICT);
    await ctx.defer(ephemeral);

    const query = ctx.options.web.query;
    const vqd = await getVQD(query);
    const results = await search(query, {
      vqd,
      safeSearch: ctx.options.web.safesearch === undefined ? SafeSearchType.STRICT : ctx.options.web.safesearch,
      time: ctx.options.web.time || SearchTimeType.ALL
    });

    if (results.noResults)
      return {
        content: 'No results were found for this query.',
        ephemeral
      };

    const topResult = results.results[0];
    await ctx.send({
      embeds: [
        {
          author: {
            icon_url: topResult.icon,
            name: topResult.hostname,
            url: 'https://' + topResult.hostname
          },
          url: topResult.url,
          title: decode(topResult.title),
          description: cutoffText(topResult.description.replace(/<\/?b>/g, '**'), 4096),
          footer: {
            text: `... ${results.results.length - 1} more result${results.results.length === 1 ? '' : 's'}`
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
              url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`,
              label: 'More on DuckDuckGo'
            }
          ]
        }
      ],
      ephemeral
    });
  }

  async searchImages(ctx: CommandContext) {
    const ephemeral =
      ctx.options.images.ephemeral ||
      (ctx.options.images.safesearch !== undefined && ctx.options.images.safesearch !== SafeSearchType.STRICT);
    await ctx.defer(ephemeral);

    const query = ctx.options.images.query;
    const vqd = await getVQD(query);
    const results = await searchImages(query, {
      vqd,
      safeSearch: ctx.options.images.safesearch === undefined ? SafeSearchType.STRICT : ctx.options.images.safesearch,
      color: ctx.options.images.color || ImageColor.ALL,
      license: ctx.options.images.license || ImageLicense.ALL,
      type: ctx.options.images.type || ImageType.ALL,
      size: ctx.options.images.size || ImageSize.ALL,
      layout: ctx.options.images.layout || ImageLayout.ALL
    });

    if (results.noResults && results.results.length === 0)
      return {
        content: 'No results were found for this query.',
        ephemeral
      };

    const topResult = results.results[0];
    await ctx.send({
      embeds: [
        {
          url: topResult.url,
          title: decode(topResult.title),
          image: { url: topResult.image },
          footer: {
            text: `[${topResult.width}x${topResult.height}]\n... ${results.results.length - 1} more result${
              results.results.length === 1 ? '' : 's'
            }`
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
              url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iar=images&iax=images&ia=images`,
              label: 'More on DuckDuckGo'
            }
          ]
        }
      ],
      ephemeral
    });
  }
}
