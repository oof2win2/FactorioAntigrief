import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"

export enum IdType {
	COMMUNITY = "community",
	RULE = "rule",
	REPORT = "report",
	REVOCATION = "revocation",
	LOG = "log",
}

@modelOptions({
	schemaOptions: {
		collection: "ids",
	},
})
export class IdClass {
	@prop({ unique: true })
		id!: string
	@prop({ enum: IdType })
		type!: IdType
}

const IdModel = getModelForClass(IdClass)
export default IdModel
