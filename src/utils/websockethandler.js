const { MessageEmbed } = require("discord.js")

module.exports = SocketMessage

async function SocketMessage (message, channel) {
    if (message.messageType === "violation") {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setColor("ORANGE")
            .setDescription("FAGC violation has been created")
            .setTimestamp()
            .setAuthor("FAGC Community")
            .addFields(
                { name: "Playername", value: message.playername },
                { name: "Admin", value: message.adminname },
                { name: "Community Name", value: message.communityname },
                { name: "Broken Rule", value: message.brokenRule },
                { name: "Automated", value: message.automated },
                { name: "Proof", value: message.proof },
                { name: "Description", value: message.description },
                { name: "Violation ID", value: message._id },
                { name: "Violation Time", value: message.violatedTime }
            )
        channel.send(embed)
    } else if (message.messageType === "revocation") {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Violation Revoked")
            .setColor("ORANGE")
            .addFields(
                { name: "Playername", value: message.playername },
                { name: "Admin", value: message.adminname },
                { name: "Community Name", value: message.communityname },
                { name: "Broken Rules", value: message.brokenRule },
                { name: "Automated", value: message.automated },
                { name: "Proof", value: message.proof },
                { name: "Description", value: message.description },
                { name: "Violation ID", value: message._id },
                { name: "Revocation Time", value: message.RevokedTime },
                { name: "Revoked by", value: message.revokedBy },
            )
            .setTimestamp()
        channel.send(embed)
    } else if (message.messageType === "ruleCreated") {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Rule created")
            .setColor("ORANGE")
            .addFields(
                { name: "Rule short description", value: message.shortdesc },
                { name: "Rule long description", value: message.longdesc }
            )
        channel.send(embed)
    } else if (message.messageType === "ruleRemoved") {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Rule removed")
            .setColor("ORANGE")
            .addFields(
                { name: "Rule short description", value: message.shortdesc },
                { name: "Rule long description", value: message.longdesc }
            )
        channel.send(embed)
    }
}