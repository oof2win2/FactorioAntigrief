import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageActionRow, MessageSelectMenu } from "discord.js"
import {SubCommand} from "../../base/Command.js"

const Ping: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("remove")
		.setDescription("Remove an infochannel")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel to stop sending notifications to")
				.setRequired(false)
		),
	execute: async (client, interaction) => {
		if (interaction.options.get("channel").value) {
			const channel = client.channels.resolve(interaction.options.get("channel").channel.id)
			if (!channel.isText()) return interaction.reply(`${channel.id} is not a text channel!`)
			if (channel.type === "DM") return interaction.reply("An error occured")
			if (channel.guildId !== interaction.guildId) return interaction.reply("You have provided a channel in a different guild")

			const existing = client.prisma.infoChannels.findFirst({
				where: {
					channelid: channel.id
				}
			})
			if (!existing) return interaction.reply(`Channel <#${channel.id}> is not recieving notifications`)

			await client.prisma.infoChannels.delete({
				where: {
					channelid: channel.id,
				}
			})
	
			if (channel.isText()) channel.send(`${interaction.user.tag} has configured it so this channel stops recieving notifications`)

			return interaction.reply(`Channel <#${channel.id}> has stopped recieving notifications`)
		}

		const infochannels = await client.prisma.infoChannels.findMany()
		const selectorOptions = infochannels.map((infochannel, i) => {
			const channel = client.channels.cache.get(infochannel.channelid)
			if (!channel.isText() || channel.isThread() || channel.type === "DM") return
			return {
				label: `#${channel.name}`,
				value: infochannel.channelid
			}
		}).filter(c=>c)

		const customId = `ChannelRow${Date.now()}`

		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId(customId)
					.setPlaceholder("Channel to stop send info messages to")
					.addOptions(selectorOptions)
			)
			
		interaction.reply({content: "Select a channel that should stop recieving notifications", components: [row]})

		const component = await interaction.channel.awaitMessageComponent({
			componentType: "SELECT_MENU",
			filter: (i) => i.customId == customId && i.user.id == interaction.user.id,
			time: 60000
		})
		if (!component.isSelectMenu()) return interaction.followUp("An error occured")

		const channel = await interaction.guild.channels.fetch(component.values[0])
		await client.prisma.infoChannels.delete({
			where: {
				channelid: channel.id
			}
		})

		if (channel.isText()) channel.send(`${interaction.user.tag} has configured it so this channel stops recieving notifications`)

		return component.reply(`Channel <#${channel.id}> has stopped recieving notifications`)
	}
}
export default Ping