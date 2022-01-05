import * as typegoose from "@typegoose/typegoose"
const { getModelForClass, modelOptions, prop } = typegoose

@modelOptions({
	schemaOptions: {
		collection: "authentication",
	},
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
