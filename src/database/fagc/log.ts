import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"
import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"

const connection = database.connections.find((connection) => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "logs",
	},
	options: {
		allowMixed: 0 // allow mixed types
	},
	existingMongoose: connection
})
@pre<LogClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class LogClass {
	@prop()
	id!: string

	@prop()
	timestamp!: Date

	@prop()
	apikey: string | undefined

	@prop({type: String})
	ip: string | undefined

	@prop()
	responseBody!: any

	@prop()
	requestBody!: any

	@prop()
	endpointAddress!: string
}
const LogModel = getModelForClass(LogClass)
export default LogModel