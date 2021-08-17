import AuthModel from "../database/fagc/authentication.js"
import CommunitySchema, {CommunityClass} from "../database/fagc/community.js"
import { BeAnObject, DocumentType } from "@typegoose/typegoose/lib/types"

export async function getCommunity(api_key: string | undefined): Promise<DocumentType<CommunityClass, BeAnObject> | null> {
	const auth = await AuthModel.findOne({ api_key: api_key })
	if (!auth) return null
	return CommunitySchema.findById(auth.communityId).exec()
}