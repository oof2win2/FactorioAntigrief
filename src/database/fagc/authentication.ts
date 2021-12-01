import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose"
import database from "../database.js"
const connection = database.connections.find(
	(connection) => connection?.n === "fagc"
)?.c

@modelOptions({
	schemaOptions: {
		collection: "authentication",
	},
	existingMongoose: connection,
})
export class AuthClass {
	@prop()
		communityId!: string

	@prop()
		api_key!: string

	@prop({ default: [], type: [ String ] })
		allowed_ips!: string[]

	@prop({ default: "public", type: String })
		api_key_type!: "public" | "master"
}

const AuthModel = getModelForClass(AuthClass)
export default AuthModel
