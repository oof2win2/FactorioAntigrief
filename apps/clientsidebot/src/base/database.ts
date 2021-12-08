import { z } from "zod"

export const BotConfig = z.object({
	apikey: z.string().nullable(),
	owner: z.string(),
})
export type BotConfigType = z.infer<typeof BotConfig>