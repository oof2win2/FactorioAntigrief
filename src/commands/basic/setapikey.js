const { MessageEmbed } = require("discord.js");
const ConfigModel = require("../../database/schemas/config")
const { getMessageResponse } = require("../../utils/responseGetter")
const Command = require("../../base/Command")
class SetAPIKey extends Command {
    constructor(client) {
        super(client, {
            name: "setapikey",
            description: "Set API key",
            aliases: [],
            usage: "[API KEY]",
            examples: ["{{p}}setapikey potatoKey"],
            category: "basic",
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: ["ADMINISTRATOR"],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: false,
        })
    }
    async run (message, args) {
        if (!args[0]) return message.channel.send("You must provide your API key as a parameter")
        message.delete()
        const apikey = args[0]

        try {
            const config = await ConfigModel.findOneAndUpdate({ guildid: message.guild.id }, {
                $set: { "apikey": apikey }
            }, { new: true })
            if (config.apikey && config.guildid === message.guild.id) {
                return message.channel.send(`${message.author} set the API key successfully!`)
            } else {
                console.error({ config })
                return message.channel.send("Error setting API key. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error setting API key. Please check logs.")
        }
    }
}
module.exports = SetAPIKey