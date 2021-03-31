/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const { Client, Collection } = require("discord.js")
const { token, prefix } = require("./botconfig.json")
const WebSocket = require("ws")
const WebSocketHandler = require("./utils/websockethandler")
const globalConfig = require("./utils/globalconfig")

const client = new Client();

client.prefix = prefix;

["commands", "aliases"].forEach((x) => (client[x] = new Collection()));
["command", "event"].forEach((x) => require(`./handlers/${x}`)(client));

try {
    const ws = new WebSocket('ws://localhost:8001', {
        port: 8001
    })
    ws.on('open', function open() {
        console.log('connected');
    })
    ws.on('close', function close() {
        console.log('disconnected')
    })
    ws.on('message', (message) => {
        let msgObj = JSON.parse(message)
        const channels = globalConfig.config.infoChannels.map((channelid) => {
            return client.channels.cache.get(channelid)
        })
        WebSocketHandler(msgObj, channels)
    });
} catch (error) {
    console.log(error)
}


client.login(token);
