import { getModelForClass, modelOptions, prop, Ref } from "@typegoose/typegoose"
import database from "../database"
import { CommunityClass } from "../fagc/community"
const connection = database.connections.find((connection) => connection.n === "bot").c

// the thing from https://github.com/oof2win2/fagc-discord-bot/blob/dev/src/database/schemas/config.js

@modelOptions({
	schemaOptions: {
		collection: "configs"
	}
})
export class ConfigClass {
	@prop({ required: true })
	communityname: string

	@prop()
	communityId: Ref<CommunityClass>

	@prop()
	guildId: string

	@prop({ required: true })
	contact: string

	@prop()
	apikey: string

	@prop()
	moderatorRoleId: string

	@prop()
	trustedCommunities: [string]

	@prop()
	ruleFilters: [string]
}

const ConfigModel = getModelForClass(ConfigClass)
export default ConfigModel