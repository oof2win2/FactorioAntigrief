import { z } from "zod"
import ENV from "../utils/env.js"

export type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>> 

export const Action = z.object({
	guildID: z.string(),
	report: z.enum([ "ban", "custom", "none" ]).default("none"),
	revocation: z.enum([ "unban", "custom", "none" ]).default("none"),
})
export type ActionType = z.infer<typeof Action>

export const BotConfig = z.object({
	apikey: z.string().nullable().optional(),
	owner: z.string().default(ENV.OWNERID),
	actions: z.array(Action).default([])
})
export type BotConfigType = z.infer<typeof BotConfig>