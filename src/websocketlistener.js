const WebSocket = require("ws")
const ws = new WebSocket("ws://localhost:8001", {
	port: 8001
})
ws.on("open", function open() {
	console.log("connected")
})

ws.on("close", function close() {
	console.log("disconnected")
})

ws.on("message", (message) => {
	let obj = JSON.parse(message)
	console.log(obj)
})