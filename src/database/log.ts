import { getUserStringFromID } from "../utils/functions-databaseless"
import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { IdType } from "./ids"


@modelOptions({
	schemaOptions: {
		collection: "logs",
	},
	options: {
		allowMixed: 0, // allow mixed types
	},
})
@pre<LogClass>("save", async function (next) {
	const id = await getUserStringFromID(IdType.LOG)
	this.id = id.id
	this._id = id._id
	next()
})
export class LogClass {
	@prop({ _id: false, type: String })
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
