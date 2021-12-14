import { z } from "zod"
import ENV from "../utils/env.js"
import fs from "node:fs/promises"

export type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>> 

export const Action = z.object({
	guildID: z.string(),
	report: z.enum([ "ban", "custom", "none" ]).default("none"),
	revocation: z.enum([ "unban", "custom", "none" ]).default("none"),
})
export type ActionType = z.infer<typeof Action>

export const BotConfig = z.object({
	guildID: z.string(),
	apikey: z.string().nullable().optional(),
	owner: z.string().default(ENV.OWNERID),
	actions: z.array(Action).default([])
})
export type BotConfigType = z.infer<typeof BotConfig>

export const FactorioServer = z.object({
	discordChannelID: z.string().optional(),
	servername: z.string().describe("Name of Factorio server that it can be identified with"),
	discordGuildID: z.string(),
	rconPort: z.number().max(65535).min(0),
	rconPassword: z.string().default(ENV.RCONPASSWORD),
	banlistPath: z.string().superRefine(async (path, ctx) => {
		if (!path.endsWith(".json")) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "File path does not have a .json extension"
			})
			return ctx
		}
		const fileStats = await fs.stat(path).catch(() => null)
		if (!fileStats) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "File does not exist"
			})
			return ctx
		}
		if (!fileStats.isFile()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "File path does not point to a file"
			})
			return ctx
		}
	})
})
export type FactorioServerType = z.infer<typeof FactorioServer>