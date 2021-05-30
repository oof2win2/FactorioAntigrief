import { Message, Structures } from "discord.js"
import FAGCBot from "../base/fagcbot";
import * as responses from "./responses"

interface BotMessageOptions {
	prefixEmoji?: string,
	edit?: boolean // edit message or send a new one
}
Structures.extend('Message', (Message) => {
	class BetterMessage extends Message {
		constructor (client, data, channel) {
			super(client, data, channel)
		} 
		error (string: string, options: BotMessageOptions = {}): Promise<Message> { // allows error messages to be sent with a standard response and emoji
			options.prefixEmoji = "error"
			string = responses.error[string] ? responses.error[string] : string
			return this.sendMessage(string, options)
		}
		success (string: string, options: BotMessageOptions = {}): Promise<Message> { // allows success messages to be sent with a standard response and emoji
			options.prefixEmoji = "success"
			return this.sendMessage(string, options)
		}
		sendMessage (string: string, options: BotMessageOptions = {}): Promise<Message> { // sends a message with options/edits the message
			if (options.prefixEmoji) {
				string = `${FAGCBot.emotes[options.prefixEmoji]} | ${string}`
			}
			if (options.edit) {
				return this.edit(string)
			} else {
				return this.channel.send(string)
			}
		}
	}
	return BetterMessage
})