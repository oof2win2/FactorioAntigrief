import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { CommunityClass } from "./community"
const connection = database.connections.find(connection => connection?.n === "fagc")?.c

@modelOptions({
	schemaOptions: {
		collection: "authentication"
	},
	existingMongoose: connection
})
export class AuthClass {
	@prop({ ref: () => CommunityClass })
	communityId: Ref<CommunityClass>

	@prop()
	api_key!: string

	@prop({ default: [], type: [String] })
	allowed_ips!: string[]
}

const AuthModel = getModelForClass(AuthClass)
export default AuthModel