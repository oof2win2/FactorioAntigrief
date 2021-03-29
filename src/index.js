/**
 * @file Index file, opening file for the bot. The bot logs in here, loads the commands, events and handlers.
 */
const { Client, Collection } = require("discord.js")
const { token, prefix } = require("./botconfig.json")
const WebSocket = require("ws")
const WebSocketHandler = require("./utils/websockethandler")

const client = new Client();

client.prefix = prefix;

["commands", "aliases"].forEach((x) => (client[x] = new Collection()));
["command", "event"].forEach((x) => require(`./handlers/${x}`)(client));

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
    console.log(msgObj)
    WebSocketHandler(msgObj, client.channels.cache.get("826176568165793802"))
});


client.login(token);
