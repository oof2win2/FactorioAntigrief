const fetch = require("node-fetch")
const { apiurl } = require("../../../config.json")
const ConfigModel = require("../../database/schemas/config")
const { MessageAttachment } = require("discord.js")

module.exports = {
    config: {
        name: "generatebanlist",
        aliases: ["banlist"],
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
            return fetch(`${apiurl}/communities/getid?id=${id}`).then(res => res.json())
        })
        
        // get trusted communities
        const trustedCommunities = await Promise.all(trustedCommunitiesProm)
        const trustedCommunityNames = trustedCommunities.map((community) => community.name)

        // get all violations based off of followed rules
        let rulePromises = config.ruleFilters.map((rule) => {
            return fetch(`${apiurl}/violations/getbyrule?id=${rule}`).then(res => res.json())
        })
        let ruleViolations = await Promise.all(rulePromises)
        let violationArr = []
        ruleViolations.forEach((violations) => {
            violations.forEach((violation) => {
                violationArr.push(violation)
            })
        })

        // filter violations so only trusted communities are on the banlist
        violationArr = violationArr.filter((violation, i) => violationArr.indexOf(violation) === i)
        violationArr = violationArr.filter((violation) => trustedCommunityNames.includes(violation.communityname))
        
        // create & send banlist
        let banlist = violationArr.map((violation) => {
            return {
                username: violation.playername,
                reason: `Banned on FAGC. Please check one of the community Discord servers or go to ${apiurl}/offenses/getall?playername=${violation.playername}`
            }
        })
        // using (null, 4) in JSON.stringify() to have nice formatting - 4 = 4 spaces for tab
        let file = new MessageAttachment(Buffer.from(JSON.stringify(banlist, null, 4)), "banlist.json")
        await message.channel.send("Banlist attatched", {
            files: [file]
        })
    },
};
