import { getModelForClass, modelOptions, pre, prop } from "@typegoose/typegoose"
import database from "../database.js"
import { getUserStringFromID } from "../../utils/functions-databaseless.js"

const connection = database.connections.find(
	(connection) => connection?.n === "fagc"
)?.c

@modelOptions({
	schemaOptions: {
		collection: "revocations",
	},
	existingMongoose: connection,
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
