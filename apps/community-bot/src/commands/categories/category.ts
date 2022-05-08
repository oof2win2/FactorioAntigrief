import { Command } from "../../base/Command"

const Category = Command({
	name: "category",
	aliases: [],
	description: "Gets a category by its ID or index in filtered categories",
	category: "categories",
	usage: "[categoryId|index]",
	examples: ["category XuciBx7", "category 1"],
	requiresRoles: false,
	requiresApikey: false,
	fetchFilters: true,
	run: async ({ client, message, args, filters }) => {
		// if the person did not provide an argument, get a message response
		const categoryId = await client.argsOrInput(
			args,
			message,
			`${client.emotes.type} Provide a category Id or index  to fetch`
		)
		if (!categoryId)
			return message.channel.send(
				`${client.emotes.warn} No category ID or index was provided`
			)
		const category = Number(categoryId)
			? await client.fagc.categories.fetchCategory({
					categoryId: filters.categoryFilters[Number(categoryId) - 1],
			  })
			: await client.fagc.categories.fetchCategory({
					categoryId: categoryId,
			  })

		if (category === null)
			return message.reply(
				`${client.emotes.warn} No category with ID of \`${categoryId}\` exists`
			)

		const embed = client
			.createBaseEmbed()
			.setTitle("FAGC Categories")
			.setDescription(`FAGC Category with ID \`${category.id}\``)
		embed.addField(category.name, category.description)

		if (client.config && filters.categoryFilters) {
			if (filters.categoryFilters.indexOf(category.id) != -1) {
				embed.addField(
					"Category index",
					(
						filters.categoryFilters.indexOf(category.id) + 1
					).toString()
				)
			}
		}

		return message.channel.send({
			embeds: [embed],
		})
	},
})

export default Category
