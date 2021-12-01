import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import database from "../database.js"
import { getUserStringFromID } from "../../utils/functions-databaseless.js"

const connection = database.connections.find(
	(connection) => connection?.n === "fagc"
)?.c

@modelOptions({
	schemaOptions: {
		collection: "rules",
	},
	existingMongoose: connection,
})
@pre<RuleClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class RuleClass {
	@prop({ _id: false })
		id!: string

	@prop()
		shortdesc!: string

	@prop()
		longdesc!: string
}

const RuleModel = getModelForClass(RuleClass)
export default RuleModel
