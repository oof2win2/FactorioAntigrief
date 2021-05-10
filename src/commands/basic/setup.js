const { MessageEmbed } = require("discord.js");
const ConfigModel = require("../../database/schemas/config")
const { getMessageResponse } = require("../../utils/responseGetter")
const Command = require("../../base/Command")
class Setup extends Command {
    constructor(client) {
        super(client, {
            name: "setup",
            description: "Setup your guild",
            aliases: [],
            usage: ["{{p}}setup"],
            category: "basic",
            dirname: __dirname,
            enabled: true,
            guildOnly: true,
            memberPermissions: ["ADMINISTRATOR"],
            botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            nsfw: false,
            ownerOnly: false,
            args: false,
            cooldown: 3000,
            requiredConfig: false,
        })
    }
    async run (message) {
        const messageFilter = response => {
            return response.author.id === message.author.id
        }
        message.channel.send("Hello! This is the bot setup process for this server")

        const contact = (await getMessageResponse(message.channel.send("Please type in a contact for this server or the server's owner"), messageFilter))?.content
        if (contact === undefined) return message.channel.send("Didn't send contact in time")

        let roleMessage = (await getMessageResponse(message.channel.send("Please ping (or type in the ID of) your role of people which can create violations"), messageFilter))
        let role
        if (roleMessage.mentions.roles.first()) role = roleMessage.mentions.roles.first().id
        else role = roleMessage.content
        if (message.guild.roles.cache.get(role) === undefined) return message.channel.send("Role is not correct")

        const apikeyMessage = await getMessageResponse(message.channel.send("Please type in your API key that you recieved from the FAGC team, if you did recieve one. Type `none` if you didn't"), messageFilter)
        apikeyMessage.delete()
        let apikey
        if (apikeyMessage.content === 'none') apikey = undefined
        else apikey = apikeyMessage.content

        let embed = new MessageEmbed()
            .setTitle("FAGC Config")
            .setAuthor(`${this.client.user.username} | oof2win2#3149`)
            .setTimestamp()
            .setDescription("Your FAGC Configuration")
        embed.addFields(
            { name: "Community name", value: message.guild.name },
            { name: "Contact", value: contact },
            { name: "Moderator role", value: `<@&${role}>` },
            { name: "API key", value: apikey ? "Hidden" : "None" }
        )
        message.channel.send(embed)
        const confirm = await message.channel.send("Are you sure you want these settings applied?")
        confirm.react("✅")
        confirm.react("❌")
        const reactionFilter = (reaction, user) => {
            return user.id == message.author.id
        }
        let reactions
        try {
            reactions = await confirm.awaitReactions(reactionFilter, { max: 1, time: 120000, errors: ['time'] })
        } catch (error) {
            return message.channel.send("Timed out.")
        }
        let reaction = reactions.first()
        if (reaction.emoji.name === "❌")
            return message.channel.send("Community configuration cancelled")

        try {
            const originalData = await ConfigModel.findOne({
                guildid: { $exists: true, $in: [message.guild.id] },
            })
            let config = {}
            if (originalData) {
                config = await ConfigModel.findOneAndReplace({ guildid: message.guild.id }, {
                    communityname: message.guild.name,
                    guildid: message.guild.id,
                    contact: contact,
                    moderatorroleId: role,
                    apikey: apikey,
                }, { new: true })
            } else {
                config = await ConfigModel.create({
                    communityname: message.guild.name,
                    guildid: message.guild.id,
                    contact: contact,
                    moderatorroleId: role,
                })
            }
            if (config.guildid && config.communityname) {
                return message.channel.send("Community configured successfully! Please run `fagc!setsetcommunityfilters` and `fagc!setrulefilters` to enable more commands (and set those filters)")
            } else {
                console.error({ config })
                return message.channel.send("Error setting configuration. Please check logs.")
            }
        } catch (error) {
            console.error({ error })
            return message.channel.send("Error setting configuration. Please check logs.")
        }
    }
}
module.exports = Setup