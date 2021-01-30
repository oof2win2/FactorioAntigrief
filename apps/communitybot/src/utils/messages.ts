import * as Discord from 'discord.js'

export function sendReply(message: Discord.Message, text: string) {
    message.reply('\n'+text)
        .then(msg => msg.delete({timeout: 10000}))
}

export function sendResult(message: Discord.Message, text: string) {
    message.channel.send('\n'+text)
}

export function sendLines(message: Discord.Message, liens: string[]) {
    const messages: string[] = []
    let currentMessage: string = ''
    liens.forEach(line => {
        if (line.length > 2000) throw new Error('Line is longer than 2000 characters')
        if (currentMessage.length + line.length > 2000) {
            messages.push(currentMessage)
            currentMessage = ''
        }
        currentMessage += '\n'+line
    })

    messages.push(currentMessage)
    messages.forEach(nextMessage => message.channel.send(nextMessage))
}