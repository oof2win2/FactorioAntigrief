/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const { Client, Collection } = require("discord.js");
const { token, prefix } = require("./botconfig.json");

const fs = require("fs");

const client = new Client();

client.prefix = prefix;

["commands", "aliases"].forEach((x) => (client[x] = new Collection()));
["command", "event"].forEach((x) => require(`./handlers/${x}`)(client));

client.login(token);
