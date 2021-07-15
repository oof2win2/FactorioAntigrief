import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import Mongoose from "mongoose"
import database from "../database"

const connection = database.connections.find((connection) => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "webhooks"
	},
	existingMongoose: connection
})
export class WebhookClass {
	@prop({_id: false})
	id!: string

	@prop()
	token!: string
	
	@prop()
	guildId!: string
}

const WebhookModel = getModelForClass(WebhookClass)

export default WebhookModel