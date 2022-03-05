import WebSocket from "ws"
let server = new WebSocket.Server({ port: 3990 })

server.addListener("connection", (ws) => {
	ws.on("message", (msg) => {
		if (typeof msg !== "string") return
		if (msg === "ping") {
			ws.send("pong")
		}
	})
})
server.on("listening", () => {
	const client = new WebSocket("ws://localhost:3990")
	setInterval(() => {
		client.send("ping")
		console.log("client sent ping")
	}, 500)
	client.addEventListener("error", console.log)
	client.addEventListener("message", (msg) => {
		console.log("client received", msg.data)
	})
	setTimeout(() => {
		server.close()
	}, 1500)

	setTimeout(() => {
		console.log(client.readyState, client.CLOSED)
		server = new WebSocket.Server({ port: 3990 })
	}, 5000)
})
