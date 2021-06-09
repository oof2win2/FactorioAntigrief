const fetch = require("node-fetch")
const { MessageEmbed } = require("discord.js")
const { getMessageResponse, getConfirmationMessage } = require("../../utils/responseGetter")
const { handleErrors } = require("../../utils/functions")
const Command = require("../../base/Command")

class CreateViolationAdvanced extends Command {
	constructor(client) {
		super(client, {
			name: "createadvanced",
			description: "Creates a violation - Advanced method. Allows specification of who created the violation and when it was created",
			aliases: ["banadvanced", "createadv", "banadv"],
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

		const admin_message = (await getMessageResponse(message, "Please type in admin user ID for the violation"))
		if (admin_message === undefined) return message.channel.send("Didn't send admin user ID in time")
		const admin_user = admin_message.mentions.users.first() || await this.client.users.fetch(admin_message.content)
		if (!admin_user) return message.channel.send("Sent user is not valid!")

		const ruleid = (await getMessageResponse(message, "Please type in ID of rule that has been broken"))?.content
		if (ruleid === undefined) return message.channel.send("Didn't send rule ID in time")

		let desc = (await getMessageResponse(message, "Please type in description of the violation or `none` if you don't want to set one"))?.content
		if (desc.toLowerCase() === "none") desc = undefined

		let proof = (await getMessageResponse(message, "Please send a link to proof of the violation or `none` if there is no proof"))?.content
		if (proof.toLowerCase() === "none") proof = undefined

		let timestamp = (await getMessageResponse(message, "Please send a value representing the date of the violation. Type in `now` to set the current time"))?.content
		if (timestamp.toLowerCase() === "now") timestamp = (new Date).toISOString()
		else {
			if (isNaN(Date.parse(timestamp))) timestamp = (new Date).toISOString()
			else timestamp = Date.parse(timestamp).toISOString()
		}

		let embed = new MessageEmbed()
			.setTitle("FAGC Violations")
			.setColor("RED")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.setDescription(`Create FAGC violation for \`${playername}\``)
		embed.addFields(
			{ name: "Admin user", value: `<@${admin_user.id}> | ${admin_user.tag}`, inline: true },
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
					adminId: admin_user.id,
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
			} else if (response.error && response.description.includes("brokenRule expected ID")) {
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
module.exports = CreateViolationAdvanced