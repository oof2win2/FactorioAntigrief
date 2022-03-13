# A server and client WebSocket package

This is a package to allow a server and client to have a form of an uninterrupted connection, making sure that data is delivered each time.

## Message types

### `message`

The purpose of a `message` is to be able to send anything down the line without expecting a response.

### `request`

The purpose of a `request` is to request some data from the peer, expecting a `response` message back with the response to the request.

### `response`

Is a response to a `request` message. Has no meaning otherwise, and will be discarded if it is not connected to a request that is waiting for a response.

### `heartbeat`

Is a message that is sent to the peer to keep the connection alive, but also tell peers if they have missed any packets.

### `acknowledge`

Sent after receiving a `message` or `response` message to acknowledge that the message has been received, telling the peer that it has been successfully delivered.

TODO:

-   [ ] implement rooms fully
-   [ ] implement a way to send data to a specific client
-   [ ] implement a way to send data to a specific room
-   [ ] implement a way to send data to all clients
-   [ ] implement a way to get rooms + clients
-   [ ] implement clients sending received messages to the server
-   [ ] heartbeat mechanism
-   [ ] store clients in a map to allow for easy access
-   [ ] store rooms in a map to allow for easy access
-   [ ] disconnect from clients if they haven't sent a heartbeat in a while
