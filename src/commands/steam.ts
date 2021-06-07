import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentType,
  ButtonStyle,
  MessageEmbedOptions,
  ComponentActionRow,
  ComponentContext
} from 'slash-create';
import { getProfile, getProfileAliases, getProfileSummary } from '../interfaces/steam';
import { stripIndents } from 'common-tags';
import clone from 'lodash.clonedeep';

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'steam',
      description: 'Do actions related to Steam.',
      guildIDs: process.env.COMMANDS_DEV_GUILD || [],
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
        }
      ]
    });
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
              **Account ID (SteamID32):** \`${profile.steamid['32']}\`
              **SteamID64:** \`${profile.steamid['64']}\`
              ${profile.custom_url ? `**Custom URL:** ${profile.custom_url}` : ''}
            `,
            inline: true
          }
        ]
      }
    };

    const btnID = (id: string) => `steam_user/${profile.steamid['64']}/${id}`;

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

    if (profile.private === true) {
      pages.main.description = '*This profile is private.*';
    } else {
      pages.main.description = getProfileSummary(profile.steamid['64'])
        .split('\n')
        .slice(0, 4)
        .join('\n')
        .slice(0, 500);

      if (profile.background_url) {
        pages.bg = {
          image: { url: profile.background_url }
        };
      }
      // State
      let state = 'Unknown';
      switch (profile.status.state) {
        case 'offline':
          state = '*Currently Offline*';
          break;
        case 'online':
          state = 'Currently Online';
          embedBase.color = 0x57cbde;
          break;
        case 'in-game':
          state = `Currently In-Game: ${profile.status.game}`;
          embedBase.color = 0x90ba3c;
          break;
      }

      // Information
      // TODO Show created timestamp in desc (dayjs)
      pages.main.fields.unshift({
        name: 'Information',
        value: [
          state + '\n',
          profile.real_name,
          profile.flag ? `:flag_${profile.flag}: ${profile.location}` : '',
          `\n**Level:** ${profile.level.formatted}`,
          profile.badge
            ? `**Badge:** [${profile.badge.name}](${profile.badge.url}) - ${profile.badge.meta} (${profile.badge.xp.estimate} xp)`
            : '',
          profile.primary_group
            ? `**Group:** [${profile.primary_group.name}](${profile.primary_group.url}) - ${profile.primary_group.member_count.estimate} member(s)`
            : ''
        ]
          .filter((v) => !!v)
          .join('\n')
      });

      // TODO Show recent activity in last field (no inline)
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

    const updatePage = (btnCtx: ComponentContext, lastPage?: string, newLabel?: string) => {
      currentPageButtons.components = pageButtons.components.map((btn) => {
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
    };

    ctx.registerComponent(btnID('bg'), async (btnCtx) => {
      if (btnCtx.user.id !== ctx.user.id) return btnCtx.acknowledge();
      const thisButton = currentPageButtons.components.find(
        (btn) => 'custom_id' in btn && btn.custom_id === btnID('bg')
      );
      const active = thisButton.style === ButtonStyle.PRIMARY;
      if (active) currentPage = 'main';
      else currentPage = 'bg';
      return updatePage(btnCtx, 'bg', `${active ? 'Show' : 'Hide'} Background`);
    });

    ctx.registerComponent(btnID('aliases'), async (btnCtx) => {
      if (btnCtx.user.id !== ctx.user.id) return btnCtx.acknowledge();
      const thisButton = currentPageButtons.components.find(
        (btn) => 'custom_id' in btn && btn.custom_id === btnID('aliases')
      );
      const active = thisButton.style === ButtonStyle.PRIMARY;
      if (!pages.aliases) {
        const aliases = await getProfileAliases(profile.steamid['64']);
        if (aliases instanceof Error) {
          pageButtons.components = pageButtons.components.map((btn) => {
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
          pageButtons.components = pageButtons.components.map((btn) => {
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
  }

  async steamGame(ctx: CommandContext) {
    // TODO steam game search
  }
}
