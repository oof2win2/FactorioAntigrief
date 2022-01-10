import { NoAuthError, RequestConfig } from "."
import { FetchRequestTypes } from "./types/privatetypes"

/**
 * A decorator that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 * Sets the `reqConfig.apikey` to be the value of the api key from the original `reqConfig` or the class.
 * 
 * Throws an error if the api key is not set.
 */
export const Authenticate = () => <
    R,
    T extends FetchRequestTypes = FetchRequestTypes
    >(
		_target: unknown,
		_propertyKey: string,
		descriptor: TypedPropertyDescriptor<(a: T) => R>
	): TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "apikey">> }) => R> => {
	// if there is no value, nothing that can be done about it
	if (!descriptor.value) return descriptor as unknown as TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "apikey">> }) => R>
	const originalMethod = descriptor.value

	descriptor.value = function (args) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { apikey } = args?.reqConfig || this
		if (!apikey) throw new NoAuthError()
		if (!args.reqConfig) args.reqConfig = {}
		args.reqConfig._keystring = `Token ${apikey}`
		return originalMethod.apply(this, [ args ])
	}


	return descriptor as unknown as TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "apikey">> }) => R>
}

/**
 * A decorator that checks whether an api key is set in the reqConfig object or on the class, if it isnt it throws an error.
 * Sets the `reqConfig.apikey` to be the value of the api key from the original `reqConfig` or the class.
 * 
 * Throws an error if the api key is not set.
 */
export const MasterAuthenticate = () => <
	R,
	T extends FetchRequestTypes = FetchRequestTypes
	>(
		_target: unknown,
		_propertyKey: string,
		descriptor: TypedPropertyDescriptor<(a: T) => R>
	): TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "masterapikey">> }) => R> => {
	// if there is no value, nothing that can be done about it
	if (!descriptor.value) return descriptor as unknown as TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "masterapikey">> }) => R>
	const originalMethod = descriptor.value

	descriptor.value = function (args) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const { masterapikey } = args?.reqConfig || this
		if (!masterapikey) throw new NoAuthError()
		if (!args.reqConfig) args.reqConfig = {}
		args.reqConfig._keystring = `Token ${masterapikey}`
		return originalMethod.apply(this, [ args ])
	}


	return descriptor as unknown as TypedPropertyDescriptor<(a: T & {reqConfig: Required<Pick<RequestConfig, "masterapikey">> }) => R>
}