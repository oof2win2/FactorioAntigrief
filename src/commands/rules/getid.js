const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")

module.exports = {
    config: {
        name: "getruleid",
        aliases: [],
        usage: "<ruleid>",
        category: "rules",
        description: "Gets rule by ID",
        accessibility: "Member",
    },
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Provide rule ID to search by")
        const resRaw = await fetch(`${client.config.apiurl}/rules/getid?id=${args[0]}`)
        const rule = await resRaw.json()

        if (rule === null)
            return message.reply(`No rule with ObjectID of ${args[0]} exists`)
        if (rule.error && rule.description === 'id is not correct ObjectID, got value of undefined')
            return message.reply(`\`${args[0]}\` is an invalid ObjectID`)
        if (rule.error)
            return message.reply(`Error: ${rule.description}`)

        let embed = new MessageEmbed()
            .setTitle("FAGC Rules")
            .setColor("GREEN")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .setDescription(`FAGC Rule with ID ${rule._id}`)
        embed.addField(rule.shortdesc, rule.longdesc)
        message.channel.send(embed)
    },
};
