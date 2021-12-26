module.exports = {
  token: process.env.DISCORD_BOT_TOKEN,
  applicationId: process.env.DISCORD_APP_ID,
  commandPath: './src/commands',
  env: {
    development: {
      globalToGuild: process.env.COMMANDS_DEV_GUILD,
      token: process.env.DISCORD_BOT_TOKEN,
      applicationId: process.env.DISCORD_APP_ID
    },
    production: {
      token: process.env.PROD_TOKEN,
      applicationId: process.env.PROD_ID,
      beforeSync: 'confirm'
    }
  }
};
