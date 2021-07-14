import { getModelForClass, modelOptions, pre, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { CommunityClass } from "./community"

const connection = database.connections.find((connection) => connection.n === "fagc").c

// TODO: add this modelOptions to all
@modelOptions({
	schemaOptions: {
		collection: "authentication"
	}
})
export class AuthClass {
	@prop()
	public communityId: Ref<CommunityClass>

	@prop()
	api_key: String

	@prop()
	allowed_ips: String[]
}

const AuthSchema = getModelForClass(AuthClass)
export default AuthSchema