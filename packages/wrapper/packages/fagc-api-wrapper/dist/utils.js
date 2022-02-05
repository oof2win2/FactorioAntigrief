"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalMasterAuthenticate = exports.masterAuthenticate = exports.optionalAuthenticate = exports.authenticate = void 0;
const _1 = require(".");
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
const authenticate = (manager, reqConfig) => {
    const apikey = reqConfig.apikey || manager.apikey;
    if (!apikey)
        throw new _1.AuthError(_1.AuthErrorType.CLIENT);
    return `Bearer ${apikey}`;
};
exports.authenticate = authenticate;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it returns null.
 *
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
const optionalAuthenticate = (manager, reqConfig) => {
    const apikey = reqConfig.apikey || manager.apikey;
    if (!apikey)
        return null;
    return `Bearer ${apikey}`;
};
exports.optionalAuthenticate = optionalAuthenticate;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
const masterAuthenticate = (manager, reqConfig) => {
    const masterapikey = reqConfig.masterapikey || manager.masterapikey;
    if (!masterapikey)
        throw new _1.AuthError(_1.AuthErrorType.CLIENT);
    return `Bearer ${masterapikey}`;
};
exports.masterAuthenticate = masterAuthenticate;
/**
 * A function that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 *
 * @throws AuthError if the API key is not set
 * @returns String to use for the Authorization header, created from original `reqConfig` or the class
 */
const optionalMasterAuthenticate = (manager, reqConfig) => {
    const masterapikey = reqConfig.masterapikey || manager.masterapikey;
    if (!masterapikey)
        return null;
    return `Bearer ${masterapikey}`;
};
exports.optionalMasterAuthenticate = optionalMasterAuthenticate;
//# sourceMappingURL=utils.js.map