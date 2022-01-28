import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import validator from "validator"
import { AuthError } from "fagc-api-wrapper"

const CreateAdvanced: Command = {
	name: "createadvanced",
	aliases: ["createadv", "createadvanced"],
	usage: "[player] [...description]",
	examples: ["create", "create Potato", "create Potato hacking"],
	description:
		"Create a report for a player, with the possiblity of input of admin who banned the user and customizing the time when the player was reported",
	category: "reports",
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	async run({ client, message, args, guildConfig }) {
		if (!guildConfig.categoryFilters.length)
			return message.channel.send(`${client.emotes.warn} No categories are filtered`)
		const playername = await client.argsOrInput(args, message, `${client.emotes.type} Type in the player name`)
		if (!playername)
			return message.channel.send(
				`${client.emotes.warn} No player name was provided`,
			)

		const adminUserMessage = await client.getMessageResponse(
			message,
			`${client.emotes.type} Type in the admin user (ping or ID) who banned the player`,
		)
		if (!adminUserMessage)
			return message.channel.send(
				`${client.emotes.warn} No admin user was provided`,
			)
		const adminUser =
			adminUserMessage.mentions.users.first() ||
			(await client.users.fetch(adminUserMessage.content).catch(() => null))
		if (!adminUser)
			return message.channel.send(
				`${client.emotes.warn} No admin user was provided`,
			)

		let description =
			args.join(" ") ||
			(await client.getMessageResponse(
				message,
				`${client.emotes.type} Type in the description of the report, or "none" if no description`,
			).then((x) => x?.content))
		if (!description || description.toLowerCase() === "none")
			description = "No description"

		const timestampMessage = await client.getMessageResponse(
			message,
			`${client.emotes.type} Type in the ISO8601 timestamp of when the player was reported (or "now" if current time). Use <https://www.timestamp-converter.com/> to find the timestamp`,
		).then((x) => x?.content)
		let timestamp: Date
		if (!timestampMessage || timestampMessage.toLowerCase() === "now")
			timestamp = new Date()
		else timestamp = new Date(timestampMessage)
		// new Date doesn't throw an error if an invalid string is provided, it instead makes the date object `Invalid Date`
		if (isNaN(timestamp.valueOf()))
			return message.channel.send(
				`${client.emotes.warn} Invalid timestamp provided`,
			)

		// send a message with the community's filtered categories to pick from
		const categoryEmbed = client.createBaseEmbed()
			.setTitle("FAGC Reports")
			.setDescription("Your community's filtered categories")
		const allCategories = await client.fagc.categories.fetchAll({})
		const fields: EmbedField[] = allCategories
			// make sure the category is filtered
			.filter((category) => guildConfig.categoryFilters.includes(category.id))
			// sort the categories by their index
			.sort((a, b) => guildConfig.categoryFilters.indexOf(a.id) - guildConfig.categoryFilters.indexOf(b.id))
			.map((category) => {
				return {
					name: `${guildConfig.categoryFilters.indexOf(category.id) + 1}) ${
						category.shortdesc
					} (\`${category.id}\`)`,
					value: category.longdesc,
					inline: false,
				}
			})
		createPagedEmbed(fields, categoryEmbed, message)

		const categories = await client.getMessageResponse(
			message,
			`${client.emotes.type} Type in the category(s) broken by the player, separated with spaces`,
		)
		if (!categories) return message.channel.send("Category(s) not specified")
		const categoryIds = categories.content.split(" ")
		if (categoryIds.length === 1 && categoryIds[0] === "none") {
			return message.channel.send("Category(s) not specified")
		}
		// check for validity of categories, sort into valid and invalid IDs
		const invalidCategoryIds: string[] = []
		const validCategoryIDs: string[] = []
		categoryIds.map((categoryId) => {
			let id: string
			if (isNaN(Number(categoryId))) {
				// id is string
				id = categoryId
			} else {
				// id is index in category filters
				const i = Number(categoryId)
				if (i < 0 || i > guildConfig.categoryFilters.length) {
					return invalidCategoryIds.push(categoryId)
				}
				const found = guildConfig.categoryFilters[i - 1]
				id = found
			}
			// all categories are fetched above so they are cached
			const category = client.fagc.categories.resolveID(id)
			if (!category) invalidCategoryIds.push(id)
			else validCategoryIDs.push(id)
		})
		if (invalidCategoryIds.length)
			return message.channel.send(
				`Invalid category(s): \`${invalidCategoryIds.join("`, `")}\``,
			)

		let proof = await client.getMessageResponse(
			message,
			`${client.emotes.type} Send links to proof of the report, separated with spaces, or \`none\` if there is no proof`,
		).then((x) => x?.content)
		if (!proof || proof.toLowerCase() === "none") proof = undefined
		if (proof && proof !== "No proof") {
			// check if each link is a valid URL
			const areAllURLs = proof
				.split(" ")
				.map((link) => validator.isURL(link))
				.reduce((a, b) => a && b)
			if (!areAllURLs)
				return message.channel.send(
					`${client.config.emotes.warn} Invalid proof link(s)`,
				)
		}

		// send an embed to display the report that will be created
		const checkEmbed = client.createBaseEmbed()
			.setTitle("FAGC Reports")
			// .setDescription(`**Report created by ${message.author.tag}**\n\n**Player:** ${playername}\n**Category(s):** ${validCategoryIDs.join(", ")}\n**Description:** ${desc}\n**Proof:** ${proof}`)
			.addFields([
				{ name: "Player", value: playername, inline: true },
				{
					name: "Category(s)",
					value: validCategoryIDs
						.map(
							(id) =>
								`${client.fagc.categories.resolveID(id)?.shortdesc} (\`${id}\`)`,
						)
						.join(", "),
					inline: true,
				},
				{
					name: "Description",
					value: description || "No description",
					inline: true,
				},
				{ name: "Proof", value: proof || "No proof", inline: true },
				{
					name: "Reported at",
					value: `<t:${Math.round(timestamp.valueOf() / 1000)}>`,
					inline: true,
				},
			])
		message.channel.send({
			embeds: [checkEmbed],
		})
		const confirmationMessage = await client.getConfirmationMessage(
			message,
			"Are you sure you want to create these reports?",
		)
		if (!confirmationMessage)
			return message.channel.send("Report creation cancelled")

		try {
		// create the reports for each category
			const reports = await Promise.all(
				validCategoryIDs.map(async (categoryId) => {
					return client.fagc.reports.create({
						report: {
							playername: playername,
							adminId: adminUser.id,
							description: description ?? "No description",
							proof: proof ?? "No proof",
							categoryId: categoryId,
							reportedTime: timestamp,
							automated: false,
						},
						reqConfig: {
							apikey: guildConfig.apiKey,
						},
					})
				}),
			)
			return message.channel.send(
				`Reports created with IDs: ${reports
					.map((report) => `\`${report.id}\``)
					.join(", ")}`,
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return message.channel.send(`${client.emotes.warn} Your API key is not recognized by FAGC`)
			}
			throw e
		}
	},
}
export default CreateAdvanced
