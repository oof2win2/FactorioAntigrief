import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { MessageActionRow, MessageSelectMenu } from "discord.js"
import {SubCommand} from "../../base/Command.js"

const AddInfochannel: SubCommand = {
	data: new SlashCommandSubcommandBuilder()
		.setName("add")
		.setDescription("Add an infochannel")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel to send notifications to")
				.setRequired(false)
		),
	execute: async (client, interaction) => {
		if (interaction.options.get("channel").value) {
			const channel = client.channels.resolve(interaction.options.get("channel").channel.id)
			if (!channel.isText()) return interaction.reply(`${channel.id} is not a text channel!`)
			if (channel.type === "DM") return interaction.reply("An error occured")
			if (channel.guildId !== interaction.guildId) return interaction.reply("You have provided a channel in a different guild")

			const existing = await client.prisma.infoChannels.findFirst({where: {
				channelid: channel.id
			}})
			if (existing) return interaction.reply(`Channel <#${channel.id}> is already recieving notifications!`)
			await client.prisma.infoChannels.create({
				data: {
					channelid: channel.id,
					configid: 1
				}
			})
	
			if (channel.isText()) channel.send(`${interaction.user.tag} has configured it so this channel recieves notifications`)
	
			return interaction.reply(`Channel <#${channel.id}> will start recieving notifications`)
		}

		const selectorOptions = interaction.guild.channels.cache.map(channel => {
			if (!channel.isText()) return
			return {
				label: `#${channel.name}`,
				value: channel.id
			}
		}).filter(r=>r)

		const customId = `ChannelRow${Date.now()}`

		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId(customId)
					.setPlaceholder("Channel to send info messages to")
					.addOptions(selectorOptions)
			)
			
		interaction.reply({content: "Select a channel that should recieve notifications", components: [row]})

		const component = await interaction.channel.awaitMessageComponent({
			componentType: "SELECT_MENU",
			filter: (i) => i.customId == customId && i.user.id == interaction.user.id,
			time: 60000
		})
		if (!component.isSelectMenu()) return interaction.followUp("An error occured")

		const channel = await interaction.guild.channels.fetch(component.values[0])
		const existing = await client.prisma.infoChannels.findFirst({where: {
			channelid: channel.id
		}})
		if (existing) return component.reply(`Channel <#${channel.id}> is already recieving notifications!`)
		await client.prisma.infoChannels.create({
			data: {
				channelid: channel.id,
				configid: 1
			}
		})

		if (channel.isText()) channel.send(`${interaction.user.tag} has configured it so this channel recieves notifications`)

		return component.reply(`Channel <#${channel.id}> will start recieving notifications`)
	}
}
export default AddInfochannel