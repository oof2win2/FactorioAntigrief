import * as Discord from 'discord.js'

// Reply to a message, used for errors
export function sendReply(message: Discord.Message, text: string) {
    message.reply('\n'+text)
        .then(msg => msg.delete({timeout: 10000}))
}

// Reply to a message, used for success
export function sendResult(message: Discord.Message, text: string) {
    message.channel.send('\n'+text)
}

// Reply to a message, used for variable length output
export function sendLines(message: Discord.Message, liens: string[]) {
    const messages: string[] = []
    let currentMessage: string = ''
    // Only add the next line if it is less than 2000 chars
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