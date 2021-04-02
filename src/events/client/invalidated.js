module.exports = (client) => {
    console.log(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`)
}