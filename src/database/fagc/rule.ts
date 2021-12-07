import typegoose from "@typegoose/typegoose"
const { getModelForClass, modelOptions, pre, prop } = typegoose
import { getUserStringFromID } from "../../utils/functions-databaseless.js"

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
