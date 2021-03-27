module.exports = (client) => {
  console.log(`${client.user.username} is online: ${new Date().toString().slice(4, 24)}`)
};
