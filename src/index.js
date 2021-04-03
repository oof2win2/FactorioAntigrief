/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const { Client, Collection } = require("discord.js")
const { token, prefix, mongoURI } = require("../config.json")
const mongoose = require("mongoose")
const fs = require("fs")

process.chdir(__dirname)

// remove all files from ./temp/ dir to prevent random bs
try {
    if (!fs.existsSync('./temp/')) fs.mkdirSync('./temp')
    let tempFiles = fs.readdirSync('./temp/')
    tempFiles.forEach(file => {
        fs.rmSync(`./temp/${file}`);
    });
} catch (error) {
    console.error(error);
}

const client = new Client();

client.prefix = prefix;

["commands", "aliases"].forEach((x) => (client[x] = new Collection()));
["command", "event"].forEach((x) => require(`./handlers/${x}`)(client));

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

client.login(token);
