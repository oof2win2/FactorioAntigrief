import { z } from "zod"
import ENV from "../utils/env.js"

export type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> &
	Partial<Pick<T, K>>

export const BotConfig = z.object({
	guildId: z.string(),
	apikey: z.string().nullable().optional(),
	owner: z.string().default(ENV.OWNERID),
	lastNotificationProcessed: z.date().default(new Date()),
	reportAction: z.enum(["ban", "custom", "none"]).default("none"),
	revocationAction: z.enum(["unban", "custom", "none"]).default("none"),
})
export type BotConfigType = z.infer<typeof BotConfig>

export const FactorioServer = z.object({
	discordChannelId: z.string(),
	servername: z
		.string()
		.describe("Name of Factorio server that it can be identified with"),
	discordGuildId: z.string(),

	rconPort: z.number().max(65535).min(0),
	rconPassword: z.string().default(ENV.RCONPASSWORD),

	serverFolderName: z.string().optional(),
	absoluteServerPath: z.string().optional(),
	gatherActions: z.boolean().default(true),
	actionFilePath: z.string().default("script-output/fdgl-actions.txt"),
	// banlistPath: z.string().superRefine(async (path, ctx) => {
	// 	if (!path.endsWith(".json")) {
	// 		ctx.addIssue({
	// 			code: z.ZodIssueCode.custom,
	// 			message: "File path does not have a .json extension"
	// 		})
	// 		return ctx
	// 	}
	// 	const fileStats = await fs.stat(path).catch(() => null)
	// 	if (!fileStats) {
	// 		ctx.addIssue({
	// 			code: z.ZodIssueCode.custom,
	// 			message: "File does not exist"
	// 		})
	// 		return ctx
	// 	}
	// 	if (!fileStats.isFile()) {
	// 		ctx.addIssue({
	// 			code: z.ZodIssueCode.custom,
	// 			message: "File path does not point to a file"
	// 		})
	// 		return ctx
	// 	}
	// })
})
export type FactorioServerType = z.infer<typeof FactorioServer>
