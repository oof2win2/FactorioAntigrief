export class NoApikeyError extends Error {
	constructor() {
		super("No API key has been set")
	}
}
export class NoMasterApikeyError extends Error {
	constructor() {
		super("No Master API key has been set")
	}
}
export class AuthenticationError extends Error {
	constructor() {
		super("Wrong API key has been set")
	}
}
export class MasterAuthenticationError extends Error {
	constructor() {
		super("Wrong Master API key has been set")
	}
}
export class GenericAPIError extends Error {
	constructor(msg: string | { error: string; message: string }) {
		super(typeof msg == "string" ? msg : `${msg.error}: ${msg.message}`)
	}
}
export class UnsuccessfulRevocationError extends Error {
	constructor() {
		super("Revocation not created successfully")
	}
}
