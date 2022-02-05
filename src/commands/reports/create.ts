import { EmbedField } from "discord.js"
import { Command } from "../../base/Command"
import { createPagedEmbed } from "../../utils/functions"
import validator from "validator"
import { AuthError } from "fagc-api-wrapper"

const CreateReport: Command = {
	name: "createreport",
	description: "Create a report for a player",
	category: "reports",
	aliases: ["create", "ban"],
	usage: "[player] [...description]",
	examples: ["create", "create Potato", "create Potato hacking"],
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	run: async ({ client, message, args, guildConfig }) => {
		if (!guildConfig.categoryFilters.length)
			return message.channel.send(`${client.emotes.warn} No categories are filtered`)

		const playername = await client.argsOrInput(args, message, `${client.emotes.type} Type in the player name`)
		if (!playername) return message.channel.send("Player name not specified")

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
		const validCategoryIds: string[] = []
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
				id = guildConfig.categoryFilters[i - 1]
			}
			// all categories are fetched above so they are cached
			const category = client.fagc.categories.resolveId(id)
			if (!category) invalidCategoryIds.push(id)
			else validCategoryIds.push(id)
		})
		if (invalidCategoryIds.length)
			return message.channel.send(
				`Invalid category(s): \`${invalidCategoryIds.join("`, `")}\``,
			)

		let desc =
			args.join(" ") ||
			(await client.getMessageResponse(
				message,
				`${client.emotes.type} Type in description of the report or \`none\` if you don't want to set one`,
			).then((m) => m?.content))
		if (!desc || desc.toLowerCase() === "none") desc = undefined

		let proof = await client.getMessageResponse(
			message,
			`${client.emotes.type} Send links to proof of the report, separated with spaces, or \`none\` if there is no proof`,
		).then((x) => x?.content)
		if (!proof || proof.toLowerCase() === "none") proof = "No proof"
		if (proof !== "No proof") {
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

		const timestamp = Date.now()

		// send an embed to display the report that will be created
		const checkEmbed = client.createBaseEmbed()
			.setTitle("FAGC Reports")
			// .setDescription(`**Report created by ${message.author.tag}**\n\n**Player:** ${playername}\n**Category(s):** ${validCategoryIds.join(", ")}\n**Description:** ${desc}\n**Proof:** ${proof}`)
			.addFields([
				{ name: "Player", value: playername, inline: true },
				{
					name: "Category(s)",
					value: validCategoryIds
						.map(
							(id) =>
								`${client.fagc.categories.resolveId(id)?.shortdesc} (\`${id}\`)`,
						)
						.join(", "),
					inline: true,
				},
				{ name: "Description", value: desc || "No description", inline: true },
				{ name: "Proof", value: proof || "No proof", inline: true },
				{
					name: "Reported at",
					value: `<t:${Math.round(timestamp / 1000)}>`,
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
				validCategoryIds.map(async (categoryId) => {
					return client.fagc.reports.create({
						report: {
							playername: playername,
							adminId: message.author.id,
							description: desc ?? "No description",
							proof: proof ?? "No proof",
							categoryId: categoryId,
							reportedTime: new Date(timestamp),
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
export default CreateReport
