type MessageTypeEnum =
	| "message"
	| "heartbeat"
	| "acknowledge"
	| "request"
	| "response"

export interface BaseMessage {
	messageType: MessageTypeEnum
	seq: number
	data: any
	sentAt: number
}

export interface ResponseMessage extends BaseMessage {
	messageType: "response"
	/**
	 * Which request this response is for
	 */
	requestId: number
}

export interface HeartbeatMessage extends BaseMessage {
	messageType: "heartbeat"
	/**
	 * Last sequence number that has been sent
	 */
	seq: number
	data: null
}

export interface AcknowledgeMessage extends BaseMessage {
	messageType: "acknowledge"
	/**
	 * Sequence number of the message that has been acknowledged
	 */
	seq: number
}

export interface Message extends BaseMessage {
	messageType: "message"
}

export interface RequestMessage extends BaseMessage {
	messageType: "request"
	/**
	 * Sequence number of the request
	 */
	seq: number
}

type MessageType =
	| ResponseMessage
	| HeartbeatMessage
	| AcknowledgeMessage
	| Message
	| RequestMessage
export default MessageType
