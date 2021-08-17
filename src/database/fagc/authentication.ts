import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose"
import database from "../database.js"
import { CommunityClass } from "./community.js"
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

	@prop({ default: "public", type: String })
	api_key_type!: "public" | "master"
}

const AuthModel = getModelForClass(AuthClass)
export default AuthModel