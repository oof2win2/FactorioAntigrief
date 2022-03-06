import TypedEventEmmiter, { TypedEventEmmiterTypes } from "./TypedEventEmmiter"

export default function promisifyEvent<
	X extends TypedEventEmmiterTypes,
	T extends TypedEventEmmiter<X> = TypedEventEmmiter<{}>,
	E extends keyof X = keyof X
>(eventEmitter: T, eventName: E): Promise<Parameters<X[E]>> {
	return new Promise<any>((resolve) => {
		eventEmitter.once(eventName, ((...args: Parameters<X[E]>) => {
			resolve(args)
		}) as X[E])
	})
}
