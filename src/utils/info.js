const { WebhookClient, MessageEmbed } = require("discord.js")
const WebhookSchema = require("../database/schemas/webhook")
const WebSocket = require("ws")
const wss = new WebSocket.Server({ port: 8001 });

module.exports = {
    WebhookMessage,
    WebsocketMessage,
    violationCreatedMessage,
    violationRevokedMessage,
}

async function WebhookMessage(message, level = 1) {
    // 3 levels
    //  0: error
    //  1: ban or other info (default)
    //  2: debug
    const webhooks = await WebhookSchema.find({ level: { $gte: level } })
    webhooks.forEach(async (webhook) => {
        const client = new WebhookClient(webhook.id, webhook.token)
        client.send(message)
    })
}
async function WebsocketMessage(message) {
    // console.log(message)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    })
}
async function violationCreatedMessage(violation) {
    if (violation === null || violation.playername === undefined) return
    violation.messageType = "violation"
    WebsocketMessage(JSON.stringify(violation))
    try {
        let violationEmbed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Violation Created")
            .setColor("ORANGE")
            .addFields(
                { name: "Playername", value: violation.playername },
                { name: "Admin", value: violation.adminname },
                { name: "Community Name", value: violation.communityname },
                { name: "Broken Rule", value: violation.brokenRule },
                { name: "Automated", value: violation.automated },
                { name: "Proof", value: violation.proof },
                { name: "Description", value: violation.description },
                { name: "Violation ID", value: violation._id },
                { name: "Violation Time", value: violation.violatedTime }
            )
            .setTimestamp()
        let message = {}
        message.embeds = [violationEmbed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a violation message.`, 2)
        console.log(time)
        console.error(error)
    }
}
async function violationRevokedMessage(revocation) {
    if (revocation === null || revocation.playername === undefined) return
    revocation.messageType = "revocation"
    WebsocketMessage(JSON.stringify(revocation))
    try {
        let revocationEmbed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Violation Revoked")
            .setColor("ORANGE")
            .addFields(
                { name: "Playername", value: revocation.playername },
                { name: "Admin", value: revocation.adminname },
                { name: "Community Name", value: revocation.communityname },
                { name: "Broken Rules", value: revocation.brokenRule },
                { name: "Automated", value: revocation.automated },
                { name: "Proof", value: revocation.proof },
                { name: "Description", value: revocation.description },
                { name: "Violation ID", value: revocation._id },
                { name: "Revocation Time", value: revocation.RevokedTime },
                { name: "Revoked by", value: revocation.revokedBy },
            )
            .setTimestamp()
        let message = {}
        message.embeds = [revocationEmbed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a violation revocation message.`, 2)
        console.log(time)
        console.error(error)
    }
}


wss.on('connection', () => {
    console.log("new WebSocket connection!");
})
wss.on('listening', () => {
    console.log("Websocket listening!")
})