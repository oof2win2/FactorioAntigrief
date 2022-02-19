import { TextBasedChannel, Channel, TextChannel } from "discord.js"

export function isGuildTextChannel(
	channel: TextBasedChannel
): channel is TextChannel {
	return channel.type !== "DM"
}

declare module "discord.js" {
	interface Channel {
		isNotDMChannel(): this is Extract<
			TextBasedChannel,
			TextChannel | NewsChannel | ThreadChannel
		>
	}
}

Channel.prototype.isNotDMChannel = function () {
	if (!this.isText()) return false
	return this.type === "DM" ? false : true
}
