import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import { getUserStringFromID } from "../utils/functions-databaseless"
import { IdType } from "./ids"

@modelOptions({
	schemaOptions: {
		collection: "revocations",
	},
})
@pre<RevocationClass>("save", async function (next) {
	const id = await getUserStringFromID(IdType.REVOCATION)
	this.id = id.id
	this._id = id._id
	this.createdAt = this.createdAt || new Date()
	next()
})
export class RevocationClass {
	@prop({ unique: true })
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
