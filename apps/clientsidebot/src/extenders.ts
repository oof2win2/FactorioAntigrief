import { TextBasedChannels, Channel, TextChannel, DMChannel } from "discord.js"

export function isGuildTextChannel(channel: TextBasedChannels): channel is TextChannel {
	return channel.type !== "DM"
}


declare module "discord.js" {
	interface Channel {
		isNotDMChannel(): this is Extract<TextBasedChannels, TextChannel|NewsChannel|ThreadChannel>
	}
}

Channel.prototype.isNotDMChannel = function() {
	if (!this.isText()) return false
	return this.type === "DM" ? false : true
}