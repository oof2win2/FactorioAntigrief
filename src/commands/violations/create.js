const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const { getMessageResponse, getConfirmationMessage } = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")

class CreateViolation extends Command {
	constructor(client) {
		super(client, {
			name: "create",
			description: "Creates a violation. Use the advanced method to add in time of violation created and who created it. This command defaults to now and you",
			aliases: ["createviolation", "ban", "banhammer"],
			category: "violations",
			dirname: __dirname,
			enabled: true,
			memberPermissions: ["BAN_MEMBERS"],
			botPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			ownerOnly: false,
			cooldown: 3000,
			requiredConfig: true,
			customPermissions: ["violations"]
		})
	}
	async run(message, _, config) {
		if (!config.apikey) return message.reply("No API key set")

		const playername = (await getMessageResponse("Please type in a playername for the violation", message))?.content
		if (playername === undefined) return message.channel.send("Didn't send playername in time")

		const ruleid = (await getMessageResponse("Please type in ID of rule that has been broken", message))?.content
		if (ruleid === undefined) return message.channel.send("Didn't send rule ID in time")

		let desc = (await getMessageResponse("Please type in description of the violation or `none` if you don't want to set one", message))?.content
		if (desc.toLowerCase() === "none") desc = undefined

		let proof = (await getMessageResponse("Please send a link to proof of the violation or `none` if there is no proof", message))?.content
		if (proof.toLowerCase() === "none") proof = undefined

		const timestamp = (new Date).toISOString()

		let embed = new MessageEmbed()
			.setTitle("FAGC Violations")
			.setColor("RED")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`Create FAGC violation for \`${playername}\``)
		embed.addFields(
			{ name: "Admin user", value: `<@${message.author.id}> | ${message.author.tag}`, inline: true },
			{ name: "Player name", value: playername, inline: true },
			{ name: "Rule ID", value: ruleid, inline: true },
			{ name: "Violation description", value: desc, inline: true },
			{ name: "Proof", value: proof },
			{ name: "Violated At (ISO)", value: timestamp }
		)
		message.channel.send(embed)
		const confirm = await getConfirmationMessage(message, "Do you wish to create this rule violation?")
		if (!confirm)
			return message.channel.send("Violation creation cancelled")

		try {
			const responseRaw = await fetch(`${this.client.config.apiurl}/violations/create`, {
				method: "POST",
				body: JSON.stringify({
					playername: playername,
					adminId: message.author.id,
					brokenRule: ruleid,
					proof: proof,
					description: desc,
					automated: false,
					violatedTime: timestamp
				}),
				headers: { "apikey": config.apikey, "content-type": "application/json" }
			})
			const response = await responseRaw.json()
			if (response.id && response.brokenRule && response.violatedTime) {
				return message.channel.send(`Violation created! id: \`${response.id}\``)
			} else if (response.error && response.description === "Rule must be a RuleID") {
				return message.channel.send("RuleID is an invalid rule ID. Please check `fagc!getrules` or `fagc!getallrules`")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			console.error(error)
			return message.channel.send("Error creating violation. Please check logs.")
		}
	}
}
module.exports = CreateViolation