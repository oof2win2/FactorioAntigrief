import TypedEventEmmiter, { TypedEventEmmiterTypes } from "./TypedEventEmmiter"

export default function promisifyEvent<
	T extends TypedEventEmmiter<any>,
	E extends keyof T["_foo"]
>(eventEmitter: T, eventName: E): Promise<Parameters<T["_foo"][E]>> {
	return new Promise<any>((resolve) => {
		eventEmitter.once(eventName, ((...args: Parameters<T["_foo"][E]>) => {
			resolve(args)
		}) as T["_foo"][E])
	})
}
