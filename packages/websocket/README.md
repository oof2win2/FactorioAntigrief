# A server and client WebSocket package

This is a package to allow a server and client to have a form of an uninterrupted connection, making sure that data is delivered each time.

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
