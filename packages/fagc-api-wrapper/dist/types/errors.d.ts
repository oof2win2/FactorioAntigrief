export declare enum AuthErrorType {
    CLIENT = "No API key has been set",
    BACKEND = "API key not recognized by backend"
}
export declare class AuthError extends Error {
    type: "CLIENT" | "BACKEND";
    constructor(x?: AuthErrorType);
}
export declare class GenericAPIError extends Error {
    constructor(msg: string | {
        error: string;
        message: string;
    });
}
export declare class UnsuccessfulRevocationError extends Error {
    constructor();
}
//# sourceMappingURL=errors.d.ts.map