import * as discord from "../src/utils/discord"

export const validateDiscordUser = jest.spyOn(discord, "validateDiscordUser").mockImplementation(id => {
	if (!/[0-9]+/.test(id)) {
		return Promise.resolve(false)
	}
	return Promise.resolve({ id, bot: false } as any)
})
