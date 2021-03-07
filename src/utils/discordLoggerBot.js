const discord = require("discord.js")
const config = require("../../config.json")
const { Queue } = require("async-fifo-queue")

class Logger {
    constructor(apiToken) {
        // 0 = debug, 1 = info, 2 = error
        this.level = 0
        this.online = false

        this.messageQueue = new Queue();

        this.client = new discord.Client();

        this.client.on('ready', () => {
            this.message(0, "Logged in to Discord!")
            this.online = true
            this.discordMessageChannelID = config.discordMessageChannel
        })

        this.client.login(apiToken)
        this.errorPing = `<#${config.discordErrorPing}>`
        setInterval(() => {
            this._checkQueuedMessages()
        }, 5000)
        setTimeout(() => {
            console.log(this.messageQueue.get())
        }, 500)
    }
    async message (level, message) {
        if (level > this.level) return
        if (this.online == false) return this.messageQueue.putNowait({level: level, msg: message})
        this._sendMessage(level, message);
    }
    async _checkQueuedMessages() {
        console.log(`size: ${this.messageQueue.currSize}`)
        if (this.messageQueue.isEmpty === true) return
        const message = this.messageQueue.get();
        this._sendMessage(message.level, message.msg);
    }
    async _sendMessage (level, message) {
        let channel = this.client.channels.cache.get(this.discordMessageChannelID);
        if (level == 2) channel.send(`${this.errorPing} - ${message}`)
        else channel.send(`${message}`)
    }
}

let fagcbot = new Logger(config.discordAPIKey);
module.exports = fagcbot