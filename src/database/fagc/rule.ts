import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../../utils/functions-databaseless"

@modelOptions({
	schemaOptions: {
		collection: "rules",
	},
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
