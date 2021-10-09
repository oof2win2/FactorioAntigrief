export const UnauthenticatedResponse = {
	statusCode: 401,
	error: "Unauthenticated",
	message: 'You must provide authentication with the "authentication" header',
}

export const OAUTHSCOPES = ["identify", "guilds"]
