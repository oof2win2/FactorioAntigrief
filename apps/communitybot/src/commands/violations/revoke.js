const fetch = require("node-fetch")
const strictUriEncode = require("strict-uri-encode")
const { MessageEmbed } = require("discord.js")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")
const { getConfirmationMessage } = require("../../utils/responseGetter")

class Revoke extends Command {
	constructor(client) {
		super(client, {
			name: "revoke",
			description: "Revokes a player's violation with the violation ID",
			aliases: ["revokeid"],
			category: "violations",
			usage: "[violationid]",
			examples: ["{{p}}revoke 60689a97674ac1edb15186f0"],
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["BAN_MEMBERS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["violations"],
		})
	}
	async run(message, args, config) {
		if (!config.apikey)
			return message.reply("No API key set")
        
		if (!args[0]) return message.reply("Provide a ID for the violation to revoke")
		const violationID = args.shift()

		const violationRaw = await fetch(`${this.client.config.apiurl}/violations/getbyid?id=${strictUriEncode(violationID)}`)
		const violation = await violationRaw.json()
		if (!violation?.id)
			return message.channel.send(`Violation with ID \`${violationID}\` doesn't exist`)
		if (violation.error && violation.description.includes("id expected ID"))
			return message.reply(`\`${violationID}\` is not a proper violation ID`)

		let embed = new MessageEmbed()
			.setTitle("FAGC Violation Revocation")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`FAGC Violation \`${violation.id}\` of player \`${violation.playername}\` in community ${config.communityname}`)
		const creator = await this.client.users.fetch(violation.admin_id)
		embed.addFields(
			{ name: "Admin", value: `<@${creator.id}> | ${creator.tag}` },
			{ name: "Broken rule ID", value: violation.broken_rule },
			{ name: "Proof", value: violation.proof },
			{ name: "Description", value: violation.description },
			{ name: "Automated", value: violation.automated },
			{ name: "Violated time", value: Date(violation.violated_time) }
		)
		message.channel.send(embed)

		const confirm = await getConfirmationMessage(message, "Are you sure you want to revoke this violation?")
		if (!confirm)
			return message.channel.send("Violation revocation cancelled")

		try {
			const responseRaw = await fetch(`${this.client.config.apiurl}/violations/revoke`, {
				method: "DELETE",
				body: JSON.stringify({
					id: violationID,
					admin_id: message.author.id
				}),
				headers: { "apikey": config.apikey, "content-type": "application/json" }
			})

			const response = await responseRaw.json()

			if (response.id && response.revokedBy && response.revokedTime) {
				return message.channel.send("Violation revoked!")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			console.error({ error })
			return message.channel.send("Error revoking violation. Please check logs.")
		}
	}
}
module.exports = Revoke