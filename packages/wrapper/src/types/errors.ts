export class NoApikeyError extends Error {
	constructor() {
		super("No API key has been set")
	}
}
export class AuthenticationError extends Error {
	constructor() {
		super("Wrong API key has been set")
	}
}
export class GenericAPIError extends Error {
	constructor(msg: string) {
		super(msg)
	}
}
export class UnsuccessfulRevocationError extends Error {
	constructor() {
		super("Revocation not created successfully")
	}
}