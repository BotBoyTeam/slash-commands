import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentType,
  ButtonStyle,
  MessageEmbedOptions,
  ComponentActionRow,
  ComponentContext,
  ComponentButton,
  AutocompleteContext
} from 'slash-create';
import { getProfile, getProfileAliases, getProfileSummary } from '../interfaces/steam';
import { stripIndents } from 'common-tags';
import { decode } from 'html-entities';
import clone from 'lodash.clonedeep';
import fuzzy from 'fuzzy';
import { cutoffText, dateFormat, ensureUserCtx, splitMessage } from '../util';
import { applist, fetchSteamApp } from '../interfaces/steam/store';

export default class SteamCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'steam',
      description: 'Do actions related to Steam.',
      guildIDs: process.env.COMMANDS_DEV_GUILD ? [process.env.COMMANDS_DEV_GUILD] : undefined,
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'user',
          description: 'Find a Steam user.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'query',
              description: 'Can use either a SteamID32 or a Custom URL.',
              required: true
            }
          ]
        },
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'game',
          description: 'Find a Steam application.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'query',
              description: 'Search the name of an app or use an AppID.',
              required: true,
              autocomplete: true
            }
          ]
        }
      ]
    });
  }

  async autocomplete(ctx: AutocompleteContext) {
    const value = ctx.options.game.query;
    if (!value) return [];

    const result = fuzzy.filter(value, applist, {
      extract: (app) => app.name
    });
    return ctx.sendResults(
      result
        .map((res) => ({ name: cutoffText(res.original.name, 100), value: res.original.appid.toString() }))
        .slice(0, 25)
    );
  }

  async run(ctx: CommandContext) {
    if (ctx.subcommands[0] === 'user') return this.steamUser(ctx);
    if (ctx.subcommands[0] === 'game') return this.steamGame(ctx);
    else
      return {
        content: 'Unknown subcommand.',
        ephemeral: true
      };
  }

  async steamUser(ctx: CommandContext) {
    const profile = await getProfile(ctx.options.user.query);
    if (profile.ok === false)
      return {
        content: `❌ ${profile.error}`,
        ephemeral: true
      };

    const url = `https://steamcommunity.com/${
      profile.custom_url ? `id/${profile.custom_url}` : `profiles/${profile.steamid['64']}`
    }`;

    const embedBase: MessageEmbedOptions = {
      title: profile.username,
      thumbnail: { url: profile.avatar }
    };
    let currentPage = 'main';

    const pages: { [page: string]: MessageEmbedOptions } = {
      main: {
        fields: [
          {
            name: 'Steam ID',
            value: stripIndents`
              **SteamID2:** \`${profile.steamid['2']}\`
              **SteamID3:** \`${profile.steamid['3']}\`
              **SteamID32:** \`${profile.steamid['32']}\`
              **SteamID64:** \`${profile.steamid['64']}\`
              ${profile.custom_url ? `**Custom URL:** ${profile.custom_url}` : ''}
            `,
            inline: true
          }
        ]
      }
    };

    const btnID = (id: string) => `steam_user/${id}`;

    // Show bans
    if (profile.bans.vac !== 'none' || profile.bans.game !== 'none' || profile.bans.community || profile.bans.trade) {
      pages.main.fields.push({
        name: 'Account Standing',
        value: [
          profile.bans.vac !== 'none' ? `⚠️ VAC bans: ${profile.bans.vac}` : '',
          profile.bans.game !== 'none' ? `⚠️ Game bans: ${profile.bans.game}` : '',
          profile.bans.community ? `⛔ Community banned` : '',
          profile.bans.trade ? `🚫 Trade banned` : '',
          `\n${profile.bans.days_since_last.formatted} days since last ban`
        ]
          .filter((v) => !!v)
          .join('\n'),
        inline: true
      });
    }

    const summaryCtrl = {
      pages: [] as string[],
      current: 0
    };

    if (profile.private === true) {
      pages.main.description = '*This profile is private.*';
    } else {
      const summary = getProfileSummary(profile.steamid['64']).trim();
      embedBase.description = summary.split('\n').slice(0, 4).join('\n').slice(0, 500);
      if (summary.length > embedBase.description.length) {
        summaryCtrl.pages = splitMessage(summary, { maxLength: 2048 });
        pages.summary = {
          description: summaryCtrl.pages[0]
        };
      }

      if (profile.background_url)
        pages.bg = {
          image: { url: profile.background_url }
        };
      // State
      let state = 'Unknown';
      switch (profile.status.state) {
        case 'offline':
          state = '⚪ *Currently Offline*';
          break;
        case 'online':
          state = '🔵 Currently Online';
          embedBase.color = 0x57cbde;
          break;
        case 'in-game':
          state = `🟢 Currently In-Game: ${profile.status.game}`;
          embedBase.color = 0x90ba3c;
          break;
      }

      // Information
      pages.main.fields.unshift({
        name: 'Information',
        value: [
          state,
          profile.real_name,
          profile.flag ? `:flag_${profile.flag}: ${profile.location}` : '',
          `\n**Level:** ${profile.level.formatted}`,
          `**Joined:** ${dateFormat(profile.created * 1000, 'D')}`,
          profile.badge
            ? `**Badge:** [${profile.badge.name}](${profile.badge.url}) - ${profile.badge.meta} (${profile.badge.xp.estimate} xp)`
            : '',
          profile.primary_group
            ? `**Group:** [${profile.primary_group.name}](${profile.primary_group.url}) - ${profile.primary_group.member_count.estimate} member(s)`
            : ''
        ]
          .filter((v) => !!v)
          .join('\n'),
        inline: true
      });

      if (profile.recent_activity)
        pages.main.fields.push({
          name: 'Recent Activity',
          value: stripIndents`
            **${profile.recent_activity.playtime.formatted}** hours of playtime since the last 2 weeks
            ${profile.recent_activity.games
              .map((game) => `**[${game.name}](${game.url})** - ${game.hours.formatted} hours`)
              .join('\n')}
          `
        });
    }

    const pageButtons: ComponentActionRow = {
      type: ComponentType.ACTION_ROW,
      components: [
        {
          type: ComponentType.BUTTON,
          style: ButtonStyle.SECONDARY,
          label: 'Show Aliases',
          custom_id: btnID('aliases'),
          emoji: {
            name: '🏷️'
          }
        },
        pages.bg
          ? {
              type: ComponentType.BUTTON,
              style: ButtonStyle.SECONDARY,
              label: 'Show Background',
              custom_id: btnID('bg'),
              emoji: {
                name: '🖥️'
              }
            }
          : null,
        pages.summary
          ? {
              type: ComponentType.BUTTON,
              style: ButtonStyle.SECONDARY,
              label: 'Expand Summary',
              custom_id: btnID('summary'),
              emoji: {
                name: '📄'
              }
            }
          : null
      ].filter((v) => !!v) as any
    };

    const currentPageButtons = clone(pageButtons);

    await ctx.defer();
    await ctx.send({
      embeds: [Object.assign({}, embedBase, pages[currentPage])],
      components: [
        currentPageButtons,
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'Open Profile',
              emoji: {
                id: '314349923044687872'
              },
              url
            }
          ]
        }
      ]
    });

    const updatePage = (
      btnCtx: ComponentContext,
      lastPage?: string,
      newLabel?: string,
      extraRow?: ComponentActionRow
    ) => {
      currentPageButtons.components = pageButtons.components.map((btn: ComponentButton) => {
        btn = Object.assign({}, btn);
        if ('custom_id' in btn) {
          if (btn.custom_id === btnID(currentPage)) {
            btn.style = ButtonStyle.PRIMARY;
            if (newLabel) btn.label = newLabel;
          } else btn.style = ButtonStyle.SECONDARY;
          if (btn.custom_id === btnID(lastPage) && newLabel) btn.label = newLabel;
        }
        return btn;
      });

      return btnCtx.editParent({
        embeds: [Object.assign({}, embedBase, pages[currentPage])],
        components: [
          currentPageButtons,
          extraRow || undefined,
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.LINK,
                label: 'Open Profile',
                emoji: {
                  id: '314349923044687872'
                },
                url
              }
            ]
          }
        ].filter((v) => !!v) as any
      });
    };

    ctx.registerComponent(btnID('bg'), async (btnCtx) => {
      if (await ensureUserCtx(btnCtx, ctx)) return;
      const thisButton = currentPageButtons.components.find(
        (btn) => 'custom_id' in btn && btn.custom_id === btnID('bg')
      ) as ComponentButton;
      const active = thisButton.style === ButtonStyle.PRIMARY;
      if (active) currentPage = 'main';
      else currentPage = 'bg';
      return updatePage(btnCtx, 'bg', `${active ? 'Show' : 'Hide'} Background`);
    });

    ctx.registerComponent(btnID('aliases'), async (btnCtx) => {
      if (await ensureUserCtx(btnCtx, ctx)) return;
      const thisButton = currentPageButtons.components.find(
        (btn) => 'custom_id' in btn && btn.custom_id === btnID('aliases')
      ) as ComponentButton;
      const active = thisButton.style === ButtonStyle.PRIMARY;
      if (!pages.aliases) {
        const aliases = await getProfileAliases(profile.steamid['64']);
        if (aliases instanceof Error) {
          pageButtons.components = pageButtons.components.map((btn: ComponentButton) => {
            if ('custom_id' in btn && btn.custom_id === btnID('aliases')) {
              btn.disabled = true;
              btn.custom_id = 'noop';
              btn.label = 'Aliases Unavailable';
            }
            return btn;
          });
          currentPageButtons.components = pageButtons.components;
          await btnCtx.send(`Failed to fetch aliases: ${aliases.message}`, { ephemeral: true });
          return updatePage(btnCtx);
        }
        if (aliases.length === 0) {
          pageButtons.components = pageButtons.components.map((btn: ComponentButton) => {
            if ('custom_id' in btn && btn.custom_id === btnID('aliases')) {
              btn.style = ButtonStyle.SECONDARY;
              btn.disabled = true;
              btn.custom_id = 'noop';
              btn.label = 'No aliases';
            }
            return btn;
          });
          currentPageButtons.components = pageButtons.components;
          return updatePage(btnCtx);
        } else {
          pages.aliases = {
            fields: [
              {
                name: 'Known Aliases',
                value: aliases.map((al) => al.newname).join('\n')
              }
            ]
          };
        }
      }
      if (active) currentPage = 'main';
      else currentPage = 'aliases';
      return updatePage(btnCtx, 'aliases', `${active ? 'Show' : 'Hide'} Aliases`);
    });

    const getSummaryRow = () =>
      ({
        type: ComponentType.ACTION_ROW,
        components: [
          summaryCtrl.current !== 0
            ? {
                type: ComponentType.BUTTON,
                style: ButtonStyle.SECONDARY,
                label: '',
                custom_id: btnID('summary/prev'),
                emoji: {
                  name: '◀️'
                }
              }
            : null,
          {
            type: ComponentType.BUTTON,
            style: ButtonStyle.PRIMARY,
            label: `Summary Page ${summaryCtrl.current + 1}/${summaryCtrl.pages.length}`,
            custom_id: 'noop',
            disabled: true
          },
          summaryCtrl.current !== summaryCtrl.pages.length - 1
            ? {
                type: ComponentType.BUTTON,
                style: ButtonStyle.SECONDARY,
                label: '',
                custom_id: btnID('summary/next'),
                emoji: {
                  name: '▶️'
                }
              }
            : null
        ].filter((v) => !!v) as any
      } as ComponentActionRow);

    ctx.registerComponent(btnID('summary'), async (btnCtx) => {
      if (await ensureUserCtx(btnCtx, ctx)) return;
      const thisButton = currentPageButtons.components.find(
        (btn) => 'custom_id' in btn && btn.custom_id === btnID('summary')
      ) as ComponentButton;
      const active = thisButton.style === ButtonStyle.PRIMARY;
      if (active) currentPage = 'main';
      else currentPage = 'summary';

      return updatePage(
        btnCtx,
        'summary',
        `${active ? 'Expand' : 'Hide'} Summary`,
        summaryCtrl.pages.length > 1 && !active ? getSummaryRow() : null
      );
    });

    const summaryChange = async (btnCtx: ComponentContext, next = true) => {
      if (await ensureUserCtx(btnCtx, ctx)) return;
      if (next && summaryCtrl.current !== summaryCtrl.pages.length - 1) summaryCtrl.current++;
      else if (summaryCtrl.current !== 0) summaryCtrl.current--;

      pages.summary.description = summaryCtrl.pages[summaryCtrl.current];
      return updatePage(btnCtx, 'summary', 'Hide Summary', getSummaryRow());
    };

    ctx.registerComponent(btnID('summary/prev'), (btnCtx) => summaryChange(btnCtx, false));
    ctx.registerComponent(btnID('summary/next'), (btnCtx) => summaryChange(btnCtx, true));
  }

  async steamGame(ctx: CommandContext) {
    const appid = parseInt(ctx.options.game.query, 10);
    if (isNaN(appid) || appid <= 0)
      return {
        content: '❌ Invalid App ID.',
        ephemeral: true
      };

    const app = await fetchSteamApp(appid);
    if (!app)
      return {
        content: '❌ This app does not exist.',
        ephemeral: true
      };

    return {
      embeds: [
        {
          title: app.name,
          url: `https://store.steampowered.com/app/${app.steam_appid}`,
          color: !app.release_date.coming_soon && app.price_overview.discount_percent ? 0xa4d007 : 0x407999,
          description: stripIndents`
            ${decode(app.short_description)}

            **Platforms:** ${[
              app.platforms.windows ? '<:SteamWindows:905637602848276491>' : false,
              app.platforms.mac ? '<:SteamMac:905637667398631435>' : false,
              app.platforms.linux ? '<:SteamLinux:905637706023993415>' : false
            ]
              .filter((v) => !!v)
              .join('')}
            **Developers:** ${app.developers.join(', ')}
            **Publishers:** ${app.publishers.join(', ')}
            **Genres:** ${app.genres.map((g) => g.description).join(', ')}
            **Features:** ${app.categories.map((g) => g.description).join(', ')}
            ${app.metacritic ? `**Metacritic:** [${app.metacritic.score}](${app.metacritic.url})` : ''}
          `,
          fields: [
            ...(!app.release_date.coming_soon
              ? [
                  {
                    name: 'Price',
                    value: app.is_free
                      ? 'Free'
                      : app.price_overview.discount_percent
                      ? `~~${app.price_overview.initial_formatted}~~ **${app.price_overview.final_formatted}** \`-${app.price_overview.discount_percent}%\``
                      : app.price_overview.final_formatted,
                    inline: true
                  }
                ]
              : [
                  {
                    name: 'Release Date',
                    value: app.release_date.date,
                    inline: true
                  }
                ]),
            {
              name: 'Links',
              value: stripIndents`
                **steam://run/${app.steam_appid}**
                ${app.website ? `[Website](${app.website})` : ''}
                ${app.support_info.url ? `[Support URL](${app.support_info.url})` : ''}
              `,
              inline: true
            }
          ],
          ...(app.header_image
            ? {
                image: {
                  url: app.header_image
                }
              }
            : {})
        }
      ],
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'View on Steam Store',
              url: `https://store.steampowered.com/app/${app.steam_appid}`
            },
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'View on SteamDB',
              url: `https://steamdb.info/app/${app.steam_appid}`
            }
          ]
        }
      ]
    };
    // TODO steam game search
  }
}
