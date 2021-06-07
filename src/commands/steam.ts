import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentType,
  ButtonStyle
} from 'slash-create';
import { getProfile } from '../interfaces/steam';
import { stripIndents } from 'common-tags';

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
    try {
      const profile = await getProfile(ctx.options.user.query);
      const url = `https://steamcommunity.com/${
        profile.custom_url ? `id/${profile.custom_url}` : `profiles/${profile.steamid['64']}`
      }`;

      const fields: any[] = [
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
      ];

      // Show bans
      if (profile.bans.vac !== 'none' || profile.bans.game !== 'none' || profile.bans.community || profile.bans.trade) {
        fields.push({
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
        await ctx.send({
          embeds: [
            {
              title: profile.username,
              thumbnail: { url: profile.avatar },
              description: '*This profile is private.*',
              fields
            }
          ],
          components: [
            {
              type: ComponentType.ACTION_ROW,
              components: [
                {
                  type: ComponentType.BUTTON,
                  style: ButtonStyle.LINK,
                  label: 'Open Profile',
                  url
                }
              ]
            }
          ]
        });
        return;
      }

      let color: number;
      if (profile.status.state === 'online') color = 0x57cbde;
      else if (profile.status.state === 'in-game') color = 0x90ba3c;

      // TODO Show badge in inline field
      // TODO Show recent activity in last field (no online)
      // TODO Show created timestamp in desc (dayjs)
      // TODO Show primary group in desc
      // TODO button for aliases (maybe)

      await ctx.send({
        embeds: [
          {
            color,
            title: profile.username,
            thumbnail: { url: profile.avatar },
            description: stripIndents`
              Status: **${profile.status.state} ${profile.status.game ? `\`${profile.status.game}\`` : ''}**

              ${profile.flag ? `:flag_${profile.flag}:    ` : ''} **Level \`${profile.level.formatted}\`**
            `,
            fields
          }
        ],
        components: [
          {
            type: ComponentType.ACTION_ROW,
            components: [
              {
                type: ComponentType.BUTTON,
                style: ButtonStyle.LINK,
                label: 'Open Profile',
                url
              }
            ]
          }
        ]
      });
    } catch (e) {
      return {
        content: `:x: ${(e as Error).message}`,
        ephemeral: true
      };
    }
  }

  async steamGame(ctx: CommandContext) {
    // TODO: steam game search
  }
}
