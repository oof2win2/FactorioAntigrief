module.exports = {
    getMessageResponse,
}

async function getMessageResponse(message, messageFilter, timeout = 30000) {
    message = await message
    return (await message.channel.awaitMessages(messageFilter, { max: 1, time: timeout })).first()
}