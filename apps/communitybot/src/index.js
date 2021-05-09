/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const { Collection } = require("discord.js")
const { token, prefix, mongoURI } = require("../config")
const mongoose = require("mongoose")

process.chdir(__dirname)

const FAGCBot = require("./base/fagcbot")
const client = new FAGCBot();

client.prefix = prefix;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

client.login(token);
