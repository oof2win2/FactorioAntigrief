const { MessageEmbed } = require("discord.js")
const { getMessageResponse, getConfirmationMessage } = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")
const { AuthenticationError } = require("fagc-api-wrapper")

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

		const playername = (await getMessageResponse(message, "Please type in a playername for the violation"))?.content
		if (playername === undefined) return message.channel.send("Didn't send playername in time")

		const ruleid = (await getMessageResponse(message, "Please type in ID of rule that has been broken"))?.content
		if (ruleid === undefined) return message.channel.send("Didn't send rule ID in time")

		let desc = (await getMessageResponse(message, "Please type in description of the violation or `none` if you don't want to set one"))?.content
		if (desc.toLowerCase() === "none") desc = undefined

		let proof = (await getMessageResponse(message, "Please send a link to proof of the violation or `none` if there is no proof"))?.content
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
			const response = await this.client.fagc.violations.create({
				playername: playername,
				adminId: message.author.id,
				brokenRule: ruleid,
				proof: proof,
				description: desc,
				automated: false,
				violatedTime: timestamp
			}, true, {apikey: config.apikey})
			if (response.id && response.brokenRule && response.violatedTime) {
				return message.channel.send(`Violation created! id: \`${response.id}\``)
			} else if (response.error && response.description === "Rule must be a RuleID") {
				return message.channel.send("RuleID is an invalid rule ID. Please check `fagc!getrules` or `fagc!getallrules`")
			} else {
				return handleErrors(message, response)
			}
		} catch (error) {
			if (error instanceof AuthenticationError) return message.channel.send("Your API key is set incorrectly")
			message.channel.send("Error creating violation. Please check logs.")
			throw error
		}
	}
}
module.exports = CreateViolation