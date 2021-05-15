const { WebhookClient, MessageEmbed } = require("discord.js")
const WebhookSchema = require("../database/fagc/webhook")
const WebSocket = require("ws")
const wss = new WebSocket.Server({ port: 8001 });

module.exports = {
    WebhookMessage,
    WebsocketMessage,
    violationCreatedMessage,
    violationRevokedMessage,
    ruleCreatedMessage,
    ruleRemovedMessage,
    offenseRevokedMessage,
    communityCreatedMessage,
    communityRemovedMessage,
}
async function WebhookMessage(message) {
    const webhooks = await WebhookSchema.find()
    webhooks.forEach(async (webhook) => {
        try {
            const client = new WebhookClient(webhook.id, webhook.token)
            client.send(message).catch((error) => {
                if (error.stack.includes("Unknown Webhook")) {
                    console.log(`Unknown webhook ${webhook.id} with token ${webhook.token}. GID ${webhook.guildid}. Removing webhook from database..`)
                    WebhookSchema.findByIdAndDelete(webhook._id)
                }
            })
        } catch (error) {
            console.log(error)
        }
    })
}
async function WebsocketMessage(message) {
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
                { name: "Admin", value: violation.admin_name },
                { name: "Community Name", value: violation.communityname },
                { name: "Broken Rule", value: violation.broken_rule },
                { name: "Automated", value: violation.automated },
                { name: "Proof", value: violation.proof },
                { name: "Description", value: violation.description },
                { name: "Violation ID", value: violation._id },
                { name: "Violation Time", value: violation.violated_time }
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
                { name: "Admin", value: revocation.admin_name },
                { name: "Community Name", value: revocation.communityname },
                { name: "Broken Rules", value: revocation.broken_rule },
                { name: "Automated", value: revocation.automated },
                { name: "Proof", value: revocation.proof },
                { name: "Description", value: revocation.description },
                { name: "Revocation ID", value: revocation._id },
                { name: "Revocation Time", value: revocation.revokedTime },
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

async function ruleCreatedMessage(rule) {
    if (rule === null || rule.shortdesc === undefined || rule.longdesc === undefined) return
    rule.messageType = "ruleCreated"
    WebsocketMessage(JSON.stringify(rule))
    try {
        let ruleEmbed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Rule created")
            .setColor("ORANGE")
            .addFields(
                { name: "Rule short description", value: rule.shortdesc },
                { name: "Rule long description", value: rule.longdesc }
            )
        let message = {}
        message.embeds = [ruleEmbed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a violation revocation message.`, 2)
        console.log(time)
        console.error(error)
    }
}

async function ruleRemovedMessage(rule) {
    if (rule === null || rule.shortdesc === undefined || rule.longdesc === undefined) return
    rule.messageType = "ruleRemoved"
    WebsocketMessage(JSON.stringify(rule))
    try {
        let ruleEmbed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Rule removed")
            .setColor("ORANGE")
            .addFields(
                {name: "Rule short description", value: rule.shortdesc},
                {name: "Rule long description", value: rule.longdesc}
            )
        let message = {}
        message.embeds = [ruleEmbed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a violation revocation message.`, 2)
        console.log(time)
        console.error(error)
    }
}

async function offenseRevokedMessage(offense) {
    offense.messageType = "offenseRevoked"
    WebsocketMessage(JSON.stringify(offense))
    try {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Offense revoked")
            .setColor("ORANGE")
        offense.forEach((revocation) => {
            embed.addField(
                `ID: ${revocation._id}`,
                `Playername: ${revocation.playername}, Admin: ${revocation.admin_name}, Community name: ${revocation.communityname}\n` +
                `Broken rule: ${revocation.broken_rule}, Automated: ${revocation.automated}, Proof: ${revocation.proof}\n` +
                `Description: ${revocation.description}, Revocation time: ${revocation.revokedTime}, Revoked by: ${revocation.revokedBy}\n`
            )
        })
        let message = {}
        message.embeds = [embed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a violation revocation message.`, 2)
        console.log(time)
        console.error(error)
    }
}

async function communityCreatedMessage(community) {
    community.messageType = "communityCreated"
    WebsocketMessage(JSON.stringify(community))
    try {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Community created")
            .setColor("ORANGE")
            .addFields(
                { name: "Community name", value: community.name },
                { name: "Contact", value: community.contact }
            )
        let message = {}
        message.embeds = [embed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a community creation message.`, 2)
        console.log(time)
        console.error(error)
    }
}
async function communityRemovedMessage(community) {
    community.messageType = "communityRemoved"
    WebsocketMessage(JSON.stringify(community))
    try {
        let embed = new MessageEmbed()
            .setTitle("FAGC Notifications")
            .setDescription("Community removed")
            .setColor("ORANGE")
            .addFields(
                { name: "Community name", value: community.name },
                { name: "Contact", value: community.contact }
            )
        let message = {}
        message.embeds = [embed]
        message.username = "FAGC Notifier"
        WebhookMessage(message)
    } catch (error) {
        const time = new Date()
        WebhookMessage(`Error at ${time} when sending a community removal message.`, 2)
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