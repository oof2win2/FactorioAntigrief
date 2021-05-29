export default async (client) => {
	client.logger(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`, "error")
}