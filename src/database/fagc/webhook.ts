import { getModelForClass, prop } from "@typegoose/typegoose"
import database from "../database"
const connection = database.connections.find((connection) => connection.n === "fagc").c

export class WebhookClass {
	@prop()
	id: String
	
	@prop()
	token: String
	
	@prop()
	guildId: String
}

const WebhookModel = getModelForClass(WebhookClass)
export default WebhookModel