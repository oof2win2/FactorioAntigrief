import FAGCBot from "./fagcbot"

import { MessageEmbed, TextChannel } from "discord.js"
import { HandleUnfilteredViolation, HandleUnfilteredRevocation } from "./FAGCHandler"

async function WebSocketHandler(message, client: FAGCBot) {
	let channels = await Promise.all(FAGCBot.infochannels.map(infochannel => {
		return client.channels.fetch(infochannel.channelid)
	})).then((channels)=>channels.filter(c=>c && c.isText())) as TextChannel[]
	console.log(message)
	switch (message.messageType) {
	case "guildConfig": {
		// guild config has been updated
		delete message.messageType
		console.log("config set to", message)
		FAGCBot.fagcconfig = message
		break
	}
	case "violation": {
		let embed = new MessageEmbed()
			.setTitle("FAGC Notifications")
			.setColor("ORANGE")
			.setDescription("FAGC violation has been created")
			.setTimestamp()
			.setAuthor("FAGC Community")
			.addFields(
				{ name: "Playername", value: message.playername },
				{ name: "Admin ID", value: message.admin_id },
				{ name: "Community ID", value: message.communityid },
				{ name: "Broken Rule", value: message.broken_rule },
				{ name: "Automated", value: message.automated },
				{ name: "Proof", value: message.proof },
				{ name: "Description", value: message.description },
				{ name: "Violation ID", value: message.id },
				{ name: "Violation Time", value: message.violated_time }
			);
		
		const handled = await HandleUnfilteredViolation(message)
		embed.addField("Handled with an action", handled)

		channels.forEach(channel => channel.send(embed))
		break
	}
	case "revocation": {
		let embed = new MessageEmbed()
			.setTitle("FAGC Notifications")
			.setDescription("Violation Revoked")
			.setColor("ORANGE")
			.addFields(
				{ name: "Playername", value: message.playername },
				{ name: "Admin ID", value: message.admin_id },
				{ name: "Community ID", value: message.communityid },
				{ name: "Broken Rules", value: message.broken_rule },
				{ name: "Automated", value: message.automated },
				{ name: "Proof", value: message.proof },
				{ name: "Description", value: message.description },
				{ name: "Revocation ID", value: message.id },
				{ name: "Revocation Time", value: message.RevokedTime },
				{ name: "Revoked by", value: message.revokedBy },
			)
			.setTimestamp();
		
		const handled = await HandleUnfilteredRevocation(message)
		embed.addField("Handled with an action", handled)

		channels.forEach(channel => channel.send(embed))
	}
	case "ruleCreated": {
		let embed = new MessageEmbed()
			.setTitle("FAGC Notifications")
			.setDescription("Rule created")
			.setColor("ORANGE")
			.addFields(
				{ name: "Rule short description", value: message.shortdesc },
				{ name: "Rule long description", value: message.longdesc }
			)
		channels.forEach(channel => channel.send(embed))
		break
	}
	case "ruleRemoved": {
		// when a rule is removed, all related violations are also removed in the rule removal process. no need to do that manually.
		let embed = new MessageEmbed()
			.setTitle("FAGC Notifications")
			.setDescription("Rule removed")
			.setColor("ORANGE")
			.addFields(
				{ name: "Rule short description", value: message.shortdesc },
				{ name: "Rule long description", value: message.longdesc }
			)
		channels.forEach(channel => channel.send(embed))
		break
	}
	}
}
export default WebSocketHandler
