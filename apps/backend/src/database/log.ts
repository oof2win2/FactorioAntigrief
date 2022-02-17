import { getUserStringFromId } from "../utils/functions-databaseless"
import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import IdModel, { IdType } from "./ids"

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
		const id = await getUserStringFromId(IdType.COMMUNITY)
		this.id = id.id
		this._id = id._id
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

const watcher = LogModel.watch()

watcher.on("change", async (change) => {
	if (change.operationType === "delete") {
		// delete the ID from the db too
		IdModel.deleteOne({
			_id: (change.documentKey as any)._id, // guaranteed to be present when the operation is "delete"
		}).exec()
	}
})

export default LogModel
