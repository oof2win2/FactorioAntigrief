import { EventEmitter } from "events"

export type TypedEventEmmiterTypes = Record<
	string | symbol,
	(...args: any[]) => void
>

declare interface TypedEventEmmiter<T extends TypedEventEmmiterTypes> {
	addListener<E extends keyof T>(event: E, listener: T[E]): this
	emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean
	listenerCount<E extends keyof T>(event: E): number
	listeners<E extends keyof T>(event: E): Function[]
	on<E extends keyof T>(event: E, listener: T[E]): this
	once<E extends keyof T>(event: E, listener: T[E]): this
	prependListener<E extends keyof T>(event: E, listener: T[E]): this
	prependOnceListener<E extends keyof T>(event: E, listener: T[E]): this
	removeAllListeners(event?: keyof T): this
	removeListener<E extends keyof T>(event: E, listener: T[E]): this
	rawListeners<E extends keyof T>(event: E): Function[]
}

class TypedEventEmmiter<
	T extends TypedEventEmmiterTypes
> extends EventEmitter {}
export default TypedEventEmmiter
