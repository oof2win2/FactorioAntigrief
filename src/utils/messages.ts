import * as Discord from 'discord.js'

export function sendReply(message: Discord.Message, text: string) {
    message.reply('\n'+text)
        .then(msg => msg.delete({timeout: 10000}))
}

export function sendResult(message: Discord.Message, text: string) {
    message.channel.send('\n'+text)
}