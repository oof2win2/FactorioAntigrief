import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"

@modelOptions({
	schemaOptions: {
		collection: "webhooks",
	},
})
export class WebhookClass {
	@prop({ _id: false })
		id!: string

	@prop()
		token!: string

	@prop()
		guildId!: string
}

const WebhookModel = getModelForClass(WebhookClass)

export default WebhookModel
