import { SlashCommand, CommandOptionType, SlashCreator, CommandContext } from 'slash-create';
import { formatStringList } from '../util';
import { getServer } from '../interfaces/minecraft';

export default class MinecraftCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'minecraft',
      description: 'Do actions related to Minecraft.',
      guildIDs: process.env.COMMANDS_DEV_GUILD || [],
      options: [
        {
          type: CommandOptionType.SUB_COMMAND,
          name: 'server',
          description: 'Find a Minecraft server.',
          options: [
            {
              type: CommandOptionType.STRING,
              name: 'ip',
              description: 'The IP or domain of the Minecraft server.',
              required: true
            },
            {
              type: CommandOptionType.BOOLEAN,
              name: 'bedrock',
              description: 'Whether to get info from a Bedrock server. False by default.'
            }
          ]
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    if (ctx.subcommands[0] === 'user') return this.mcUser(ctx);
    if (ctx.subcommands[0] === 'server') return this.mcServer(ctx);
    else
      return {
        content: 'Unknown subcommand.',
        ephemeral: true
      };
  }

  async mcServer(ctx: CommandContext) {
    const server = await getServer(ctx.options.server.ip, ctx.options.server.bedrock || false);
    if (server instanceof Error)
      return {
        content: `❌ ${server.message}`,
        ephemeral: true
      };

    const pubAddr = server.hostname || server.ip;

    await ctx.send({
      embeds: [
        {
          title: pubAddr,
          thumbnail: { url: `https://api.mcsrvstat.us/icon/${pubAddr}` },
          ...(server.online
            ? {
                color: 0x2ecc71,
                description: [
                  '**Status:** Online',
                  `**Players:** ${server.players.online}/${server.players.max} online`,
                  `**Version:** ${server.version}`,
                  server.software ? `**Software:** ${server.software}` : '',
                  server.map ? `**Map:** ${server.map}` : ''
                ]
                  .filter((v) => !!v)
                  .join('\n'),
                fields: [
                  server.plugins && server.plugins.raw.length
                    ? {
                        name: 'Plugins',
                        value: formatStringList(server.plugins.raw),
                        inline: true
                      }
                    : null,
                  server.mods && server.mods.raw.length
                    ? {
                        name: 'Mods',
                        value: formatStringList(server.mods.raw),
                        inline: true
                      }
                    : null,
                  {
                    name: 'Server MOTD',
                    value: `\`\`\`\n${server.motd.clean.join('\n')}\n\`\`\``
                  }
                ].filter((v) => !!v) as any
              }
            : {
                color: 0xe74c3c,
                description: '**Status:** Offline'
              })
        }
      ]
    });
  }

  async mcUser(ctx: CommandContext) {
    // TODO minecraft user search
  }
}
