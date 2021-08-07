import AuthModel from "../database/fagc/authentication"
import CommunitySchema, {CommunityClass} from "../database/fagc/community"
import discord from "./discord"
import { BeAnObject, DocumentType } from "@typegoose/typegoose/lib/types"

export async function getCommunity(api_key: string | undefined): Promise<DocumentType<CommunityClass, BeAnObject> | null> {
	const auth = await AuthModel.findOne({ api_key: api_key })
	if (!auth) return null
	return CommunitySchema.findById(auth.communityId).exec()
}
export async function checkUser(userid: string): Promise<boolean> {
	const user = await discord.users.fetch(userid)
	if (!user || !user.id) return false
	return true
}