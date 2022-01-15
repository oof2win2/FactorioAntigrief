import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "rules",
	},
})
@pre<RuleClass>("save", async function (next) {
	const id = await getUserStringFromID(IdType.RULE)
	this.id = id.id
	this._id = id._id
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
