const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const ConfigModel = require("../../database/schemas/config")
const { MessageEmbed } = require("discord.js");
const Str = require("@supercharge/strings")
const fs = require("fs")

module.exports = {
    config: {
        name: "genbanlist",
        aliases: [],
        usage: "",
        category: "basic",
        description: "Creates a .json banlist file to use for servers",
        accessibility: "Moderator",
    },
    run: async (client, message, args) => {
        const config = await ConfigModel.findOne({guildid: message.guild.id})
        if (!config.trustedCommunities) return message.reply("Please set trusted communities first")
        if (!config.ruleFilters) return message.reply("Please set rule filters first")
        message.reply("Processing banlist. Please wait")

        let trustedCommunitiesProm = config.trustedCommunities.map(id => {
            return fetch(`${apiurl}/communities/getid?id=${id}`).then(res => res.text())
        })
        const trustedCommunities = await Promise.all(trustedCommunitiesProm)
        // console.log(apiurl)

        let rulePromises = config.ruleFilters.map((rule) => {
            return fetch(`${apiurl}/violations/getbyrule?id=${rule}`).then(res => res.json())
        })
        let ruleViolations = await Promise.all(rulePromises)
        let nameArr = []
        ruleViolations.forEach((violations) => {
            if (violations === []) return
            violations.forEach((violation => {
                nameArr.push(violation.playername)
            }))
        })
        nameArr = nameArr.filter((name, i) => nameArr.indexOf(name) === i)
        let banlist = nameArr.map((name) => {
            return {
                username: name,
                reason: "Banned on FAGC. Please check one of the community Discord servers"
            }
        })

        const filepath = `./temp/${Str.random()}.txt`
        fs.writeFileSync(filepath, JSON.stringify(banlist))
        await message.channel.send("Banlist attatched", {
            files: [filepath]
        })
        fs.rmSync(filepath)
    },
};
