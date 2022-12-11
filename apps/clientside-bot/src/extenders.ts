import { TextBasedChannel, Channel, TextChannel, ChannelType } from "discord.js"

export function isGuildTextChannel(
	channel: TextBasedChannel
): channel is TextChannel {
	return channel.type !== ChannelType.DM
}

// declare module "discord.js" {
// 	interface Channel {
// 		isTextBased(): this is Extract<
// 			TextBasedChannel,
// 			TextChannel | NewsChannel | ThreadChannel
// 		>
// 	}
// }

// Channel.prototype.isTextBased = function () {
// 	if (!this.isText()) return false
// 	return this.type === ChannelType.DM ? false : true
// }
