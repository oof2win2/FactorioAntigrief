import typegoose from "@typegoose/typegoose"
const { getModelForClass, modelOptions, pre, prop } = typegoose
import { getUserStringFromID } from "../../utils/functions-databaseless.js"

@modelOptions({
	schemaOptions: {
		collection: "revocations",
	},
})
@pre<RevocationClass>("save", function (next) {
	this.id = getUserStringFromID(this._id.toString())
	this.createdAt = this.createdAt || new Date()
	next()
})
export class RevocationClass {
	@prop({ _id: false })
		id!: string

	@prop()
		reportId!: string

	@prop()
		playername!: string

	@prop()
		adminId!: string

	@prop()
		communityId!: string

	@prop()
		brokenRule!: string

	@prop()
		proof!: string

	@prop()
		description!: string

	@prop()
		automated!: boolean

	@prop()
		reportedTime!: Date

	@prop()
		revokedTime!: Date

	@prop()
		revokedBy!: string

	@prop()
		createdAt!: Date
}

const RevocationModel = getModelForClass(RevocationClass)
export default RevocationModel
