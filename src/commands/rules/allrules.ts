import { EmbedField, MessageEmbed } from "discord.js";
import { Command } from "../../base/Command";
import { createPagedEmbed } from "../../utils/functions";

const AllRules: Command = {
	name: "allrules",
	description: "Gets all rules",
	category: "rules",
	aliases: [],
	usage: "",
	examples: [],
	requiresRoles: false,
	requiresApikey: false,
	run: async ({client, message}) => {
		// fetch rules from backend
		const rules = await client.fagc.rules.fetchAll({})
		// create a nice embed to display the rules
		const embed = new MessageEmbed()
			.setTitle("FAGC Rules")
			.setColor("GREEN")
			.setTimestamp()
			.setAuthor({name: client.config.embeds.author})
			.setFooter({text: client.config.embeds.footer})
			.setDescription("All FAGC Rules")
		// create the fields for the embed
		const fields: EmbedField[] = []
		for (let i = 0; i < rules.length; i += 2) {
			fields.push({
				name: `${rules[i].shortdesc} (\`${rules[i].id}\`)`,
				// this is done so that two rules are per field to take up less space
				value: rules[i + 1] ? `**${rules[i + 1].shortdesc}** (\`${rules[i + 1].id}\`)` : "\u200b",
				inline: false
			})
		}
		createPagedEmbed(fields, embed, message, { maxPageCount: 10 })
	}
}
export default AllRules