import { SubCommand } from "../../base/Command"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Formatters } from "discord.js"
import validator from "validator"
import { AuthError } from "@fdgl/wrapper"

const Create: SubCommand<true, true> = {
	type: "SubCommand",
	data: new SlashCommandSubcommandBuilder()
		.setName("create")
		.setDescription("Create a FDGL report for a player")
		.addStringOption((option) =>
			option
				.setName("playername")
				.setDescription("Player to create report of")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("categories")
				.setDescription(
					"Category IDs or indexes in filtered categories to report the player for, separated with spaces"
				)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("description")
				.setDescription("Description of the report")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("proof")
				.setDescription("Proof of the report (URLs split by spaces)")
				.setRequired(false)
		),
	requiresRoles: true,
	requiredPermissions: ["reports"],
	requiresApikey: true,
	fetchFilters: true,
	execute: async ({ interaction, client, filters, guildConfig }) => {
		const playername = interaction.options.getString("playername", true)

		const categoryIds = interaction.options
			.getString("categories", true)
			.split(" ")
		await client.fdgl.categories.fetchAll({}) // fetch all categories to cache them
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
				if (i < 0 || i > filters.categoryFilters.length) {
					return invalidCategoryIds.push(categoryId)
				}
				id = filters.categoryFilters[i - 1]
			}
			// all categories are fetched above so they are cached
			const category = client.fdgl.categories.resolveId(id)
			if (!category) invalidCategoryIds.push(id)
			else validCategoryIds.push(id)
		})
		if (invalidCategoryIds.length)
			return interaction.reply(
				`Invalid categories: \`${invalidCategoryIds.join("`, `")}\``
			)

		const description = interaction.options.getString("description", false)
		const proof =
			interaction.options.getString("proof", false) || "No proof"
		if (proof !== "No proof") {
			const proofUrls = proof.split(" ")
			for (const url of proofUrls) {
				if (!validator.isURL(url)) {
					return interaction.reply(`Invalid proof URL: \`${url}\`.`)
				}
			}
		}

		const timestamp = new Date()

		const checkEmbed = client
			.createBaseEmbed()
			.setTitle("FDGL Reports")
			.addFields([
				{ name: "Player", value: playername, inline: true },
				{
					name: "Categoryies",
					value: validCategoryIds
						.map(
							(id) =>
								`${
									client.fdgl.categories.resolveId(id)?.name
								} (\`${id}\`)`
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
					value: Formatters.time(timestamp),
					inline: true,
				},
			])
		await interaction.reply({ embeds: [checkEmbed] })
		const confirm = await client.getConfirmation(
			interaction,
			"Are you sure you want to create these reports?",
			interaction.user,
			{ followUp: true }
		)
		if (!confirm) return interaction.followUp("Creating reports cancelled")

		try {
			// create the reports for each category
			const reports = await Promise.all(
				validCategoryIds.map(async (categoryId) => {
					return client.fdgl.reports.create({
						report: {
							playername: playername,
							adminId: interaction.user.id,
							description: description ?? "No description",
							proof: proof ?? "No proof",
							categoryId: categoryId,
							reportedTime: timestamp,
							automated: false,
						},
						reqConfig: {
							apikey: guildConfig.apikey,
						},
					})
				})
			)
			return interaction.followUp(
				`Reports created with IDs: ${reports
					.map((report) => `\`${report.id}\``)
					.join(", ")}`
			)
		} catch (e) {
			if (e instanceof AuthError) {
				return interaction.followUp(
					`${client.emotes.warn} Your API key is not recognized by FDGL`
				)
			}
			throw e
		}
	},
}

export default Create
