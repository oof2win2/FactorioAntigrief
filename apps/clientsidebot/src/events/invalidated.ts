import FAGCBot from "../base/fagcbot"

export default async (client: FAGCBot): Promise<void> => {
	client.logger(`${client.user.username} is invalidated: ${new Date().toString().slice(4, 24)}`, "error")
}