import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { CommunityClass } from "../fagc/community"
const connection = database.connections.find((connection) => connection.n === "bot").c

// the thing from https://github.com/oof2win2/fagc-discord-bot/blob/dev/src/database/schemas/config.js

@modelOptions({
	schemaOptions: {
		collection: "config"
	}
})
export class ConfigClass {
	@prop({ required: true })
	communityname: String

	@prop()
	communityId: Ref<CommunityClass>

	@prop()
	guildId: String

	@prop({ required: true })
	contact: String

	@prop()
	apikey: String

	@prop()
	moderatorRoleId: String

	@prop()
	trustedCommunities: [String]

	@prop()
	ruleFilters: [String]
}

const ConfigModel = getModelForClass(ConfigClass)
export default ConfigModel