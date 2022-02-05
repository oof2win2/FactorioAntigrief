"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsuccessfulRevocationError = exports.GenericAPIError = exports.AuthError = exports.AuthErrorType = void 0;
var AuthErrorType;
(function (AuthErrorType) {
    AuthErrorType["CLIENT"] = "No API key has been set";
    AuthErrorType["BACKEND"] = "API key not recognized by backend";
})(AuthErrorType = exports.AuthErrorType || (exports.AuthErrorType = {}));
class AuthError extends Error {
    // only place where they are client are the authentication functions, which is why it defaults to backend
    constructor(x = AuthErrorType.BACKEND) {
        super(x);
        // for easier debugging/logging where the error happened
        this.type = x === AuthErrorType.CLIENT ? "CLIENT" : "BACKEND";
    }
}
exports.AuthError = AuthError;
class GenericAPIError extends Error {
    constructor(msg) {
        super(typeof msg == "string" ? msg : `${msg.error}: ${msg.message}`);
    }
}
exports.GenericAPIError = GenericAPIError;
class UnsuccessfulRevocationError extends Error {
    constructor() {
        super("Revocation not created successfully");
    }
}
exports.UnsuccessfulRevocationError = UnsuccessfulRevocationError;
//# sourceMappingURL=errors.js.map