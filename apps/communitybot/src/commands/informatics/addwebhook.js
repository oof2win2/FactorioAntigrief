const fetch = require("node-fetch")
const Command = require("../../base/Command")

class AddWebhook extends Command {
    constructor(client) {
        super(client, {
            name: "addwebhook",
            description: "Adds a webhook to send FAGC notifications to",
            aliases: [],
            usage: "[webhook ID] [webhook token]",
            examples: ["{{p}}addwebhook 9945 ThisIsMyToken"],
            category: "informatics",
            dirname: __dirname,
            enabled: true,
            memberPermissions: ["MANAGE_WEBHOOKS"],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            ownerOnly: false,
            cooldown: 3000,
            requiredConfig: false,
        })
    }
    async run(message, args) {
        if (!args[0]) return message.reply("Provide a Webhook ID")
        if (!args[1]) return message.reply("Provide a Webhook token")
        message.delete()
        message.reply("Message removed to prevent unauthorized webhook access")

        try {
            await this.client.fetchWebhook(args[0], args[1])
        } catch (e) {
            console.log(e)
            return message.channel.send("Invalid webhook")
        }

        const webRaw = await fetch(`${this.client.config.apiurl}/informatics/addwebhook`, {
            method: "POST",
            body: JSON.stringify({
                id: args[0],
                token: args[1],
                guildid: message.guild.id
            }),
            headers: { 'content-type': 'application/json' }
        })
        const webhook = await webRaw.json();
        if (webhook._id)
            return message.reply(`The webhook will recieve FAGC notifications from now on! Testing message has been sent`)
        else {
            console.error(webook, Date.now())
            return message.reply("Error creating webhook")
        }
    }
}
module.exports = AddWebhook