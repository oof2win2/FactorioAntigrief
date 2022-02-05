export enum AuthErrorType {
	CLIENT = "No API key has been set",
	BACKEND = "API key not recognized by backend",
}

export class AuthError extends Error {
	type: "CLIENT" | "BACKEND"
	// only place where they are client are the authentication functions, which is why it defaults to backend
	constructor(x: AuthErrorType = AuthErrorType.BACKEND) {
		super(x)
		// for easier debugging/logging where the error happened
		this.type = x === AuthErrorType.CLIENT ? "CLIENT" : "BACKEND"
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
