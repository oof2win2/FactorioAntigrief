import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import database from "../database"
import { getUserStringFromID } from "../../utils/functions-databaseless"

const connection = database.connections.find((connection) => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "rules"
	},
	existingMongoose: connection
})
@pre<RuleClass>("save", function(next) {
	this.id = getUserStringFromID(this._id.toString())
	next()
})
export class RuleClass {
	@prop()
	id!: string
	
	@prop()
	shortdesc!: string
	
	@prop()
	longdesc!: string
}

const RuleModel = getModelForClass(RuleClass)
export default RuleModel