import { stripIndents } from 'common-tags';
import needle from 'needle';
import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentType,
  ButtonStyle,
  ComponentActionRow
} from 'slash-create';
import { capitalize, dateFormat, ensureUserCtx } from '../util';

const CLASS_PICTURE_IDS = {
  darkwizard: 'mage',
  knight: 'warrior',
  ninja: 'assassin',
  hunter: 'archer'
};

export default class DiceCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'wynncraft',
      description: 'Get statistics in Wynncraft.',
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'user',
          description: 'Find a Wynncraft user.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'name',
              description: 'The username of the player to view.',
              required: true
            }
          ]
        }
      ]
    });
  }

  classNameFormat(className: string) {
    return capitalize(className.startsWith('dark') ? 'Dark Wizard' : className.replace(/(\w+)\d+/, '$1'));
  }

  classPictureID(className: string) {
    className = className.replace(/(\w+)\d+/, '$1');
    return CLASS_PICTURE_IDS[className] || className;
  }

  getTimePlayed(t: number) {
    return Math.floor((t / 60) * 4.7);
  }

  async run(ctx: CommandContext) {
    if (ctx.subcommands[0] === 'user') return this.wynnUser(ctx);
    else
      return {
        content: 'Unknown subcommand.',
        ephemeral: true
      };
  }

  async wynnUser(ctx: CommandContext) {
    const res = await needle('get', `https://api.wynncraft.com/v2/player/${ctx.options.user.name}/stats`);
    if (res.statusCode !== 200)
      return {
        content: '❌ That user cannot be found!',
        ephemeral: true
      };

    const stats = res.body.data[0];

    const classSelect: ComponentActionRow = {
      type: ComponentType.ACTION_ROW,
      components: [
        {
          type: ComponentType.SELECT,
          custom_id: 'wynncraft/class',
          placeholder: `View a class... (${stats.classes.length.toLocaleString()})`,
          options: stats.classes.map((cls, index) => ({
            label: `Lv${cls.level} ${this.classNameFormat(cls.name)}`,
            description: [
              cls.gamemode.craftsman ? 'Craftsman' : false,
              cls.gamemode.hardcore ? 'Hardcore' : false,
              cls.gamemode.ironman ? 'Ironman' : false
            ]
              .filter((v) => !!v)
              .join(', '),
            value: index.toString()
          }))
        }
      ]
    };

    await ctx.defer();
    await ctx.send({
      embeds: [
        {
          title: `${stats.meta.tag.value ? `\`${stats.meta.tag.value}\` ` : ''}${stats.username} Lv${
            stats.global.totalLevel.combined
          }`,
          url: `https://wynncraft.com/stats/player/${stats.username}`,
          description: stripIndents`
            ${stats.meta.location.online ? `Online on server ${stats.meta.location.server}` : 'Offline'}
            ${stats.meta.veteran ? 'Veteran Player\n\n' : '\n'}
            **First Joined:** ${dateFormat(new Date(stats.meta.firstJoin).valueOf())}
            **Last Online:** ${dateFormat(new Date(stats.meta.lastJoin).valueOf())}
            **Playtime:** ${this.getTimePlayed(stats.meta.playtime)} hours
          `,
          fields: [
            {
              name: 'Stats',
              value: stripIndents`
                **Chests Found:** ${stats.global.chestsFound.toLocaleString()}
                **Blocks Walked:** ${stats.global.blocksWalked.toLocaleString()}
                **Items Found:** ${stats.global.itemsIdentified.toLocaleString()}
                **Mobs Killed:** ${stats.global.mobsKilled.toLocaleString()}
                **Discoveries:** ${stats.global.discoveries.toLocaleString()}
                **Events Won:** ${stats.global.eventsWon.toLocaleString()}
                **Logins:** ${stats.global.logins.toLocaleString()}
                **Deaths:** ${stats.global.deaths.toLocaleString()}
                **PvP Kills:** ${stats.global.pvp.kills.toLocaleString()}
                **PvP Deaths:** ${stats.global.pvp.deaths.toLocaleString()}
              `,
              inline: true
            },
            {
              name: 'Guild',
              value: stats.guild.name
                ? `**[${stats.guild.name}](https://wynncraft.com/stats/guild/${encodeURIComponent(
                    stats.guild.name
                  )})**\nRank: ${stats.guild.rank}`
                : '*None*'
            }
          ],
          thumbnail: {
            url: `https://visage.surgeplay.com/bust/500/${stats.uuid.replace(/-/g, '')}`
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
              label: 'View on Wynncraft',
              url: `https://wynncraft.com/stats/player/${stats.username}`
            },
            {
              type: ComponentType.BUTTON,
              style: ButtonStyle.LINK,
              label: 'View on NameMC',
              url: `https://namemc.com/profile/${stats.username}`
            }
          ]
        },
        ...(stats.classes.length ? [classSelect] : [])
      ]
    });

    ctx.registerComponent('wynncraft/class', async (selectCtx) => {
      if (await ensureUserCtx(selectCtx, ctx)) return;

      const classIndex = parseInt(selectCtx.values[0], 10);
      const gameClass = stats.classes[classIndex];

      await selectCtx.send({
        embeds: [
          {
            title: `${stats.meta.tag.value ? `\`${stats.meta.tag.value}\` ` : ''}${stats.username}'s Lv${
              gameClass.level
            } ${this.classNameFormat(gameClass.name)}`,
            url: `https://wynncraft.com/stats/player/${stats.username}`,
            description:
              (gameClass.gamemode.craftsman ? ':hammer: Craftsman Mode\n' : '') +
              (gameClass.gamemode.hardcore ? ':skull: Hardcore Mode\n' : '') +
              (gameClass.gamemode.ironman ? ':shield: Ironman Mode\n' : '') +
              `\n**Playtime:** ${this.getTimePlayed(gameClass.playtime)} hours\n`,
            fields: [
              {
                name: 'Stats',
                value: stripIndents`
                  **Chests Found:** ${gameClass.chestsFound.toLocaleString()}
                  **Blocks Walked:** ${gameClass.blocksWalked.toLocaleString()}
                  **Items Found:** ${stats.global.itemsIdentified.toLocaleString()}
                  **Mobs Killed:** ${gameClass.mobsKilled.toLocaleString()}
                  **Discoveries:** ${gameClass.discoveries.toLocaleString()}
                  **Events Won:** ${gameClass.eventsWon.toLocaleString()}
                  **Logins:** ${gameClass.logins.toLocaleString()}
                  **Deaths:** ${gameClass.deaths.toLocaleString()}
                  **PvP Kills:** ${gameClass.pvp.kills.toLocaleString()}
                  **PvP Deaths:** ${gameClass.pvp.deaths.toLocaleString()}
                  **Dungeons Completed:** ${gameClass.dungeons.completed.toLocaleString()}
                  **Quests Completed:** ${gameClass.quests.completed}/157 (${(
                  (gameClass.quests.completed / 157) *
                  100
                ).toFixed(2)}%)
                `,
                inline: true
              },
              {
                name: 'Professions',
                value: Object.keys(gameClass.professions)
                  .map(
                    (k) => `**${capitalize(k)}:** ${gameClass.professions[k].level} (${gameClass.professions[k].xp}%)`
                  )
                  .join('\n'),
                inline: true
              },
              {
                name: 'Skills',
                value: stripIndents`
                  **✤ Strength:** ${gameClass.skills.strength}
                  **✦ Dexerity:** ${gameClass.skills.dexterity}
                  **❉ Intelligence:** ${gameClass.skills.intelligence}
                  **✹ Defense:** ${gameClass.skills.defense}
                  **❋ Agility:** ${gameClass.skills.agility}
                `,
                inline: true
              }
            ],
            thumbnail: {
              url: `https://cdn.wynncraft.com/img/stats/classes/${this.classPictureID(gameClass.name)}.png`
            }
          }
        ]
      });
    });
  }
}
