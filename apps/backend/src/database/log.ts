import { createUniqueId } from "../utils/functions-databaseless"
import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"

@modelOptions({
	schemaOptions: {
		collection: "logs",
	},
	options: {
		allowMixed: 0, // allow mixed types
	},
})
@pre<LogClass>("save", async function (next) {
	if (!this.id || !this._id) {
		const id = await createUniqueId(LogModel)
		this.id = id
	}
	next()
})
export class LogClass {
	@prop({ type: String })
	id!: string

	@prop()
	timestamp!: Date

	@prop()
	apikey: string | undefined

	@prop({ type: String })
	ip: string | undefined

	@prop()
	responseBody!: unknown

	@prop()
	requestBody!: unknown

	@prop()
	endpointAddress!: string
}
const LogModel = getModelForClass(LogClass)

export default LogModel
