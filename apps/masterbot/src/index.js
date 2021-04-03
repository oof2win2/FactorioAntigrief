/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and Factorio handlers.
 */
const { Client, Collection } = require("discord.js");
const { token, botprefix } = require("../config.json")

const client = new Client();

process.chdir(__dirname)

client.prefix = botprefix;

["commands", "aliases"].forEach((x) => (client[x] = new Collection()));
["command", "event"].forEach((x) => require(`./handlers/${x}`)(client));

client.login(token)
