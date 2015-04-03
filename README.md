# streamy: Directly use meteor streams with a friendly to use API.

## Core

### Streamy.emit(message_name, data_object, [socket])

Send a message with associated data to a socket. On the client, you do not need to provide the socket arg since it will use the client socket. On the server, you must provide it.

### Streamy.on(message_name, callback)

Register a callback for a specific message. The callback will be called when a message of this type has been received. Callback are of the form:

```javascript
// Client
Streamy.on('my_message', function(data) {
  console.log(data);
});

// Server
Streamy.on('my_message', function(data, from) {
  // from is a Socket object
  Streamy.emit('pong', {}, from); // An example of replying to a message
});
```

### Streamy.onConnect(callback) / Streamy.onDisconnect(callback)

Register callbacks to be called upon connection, disconnection. Please not that this is tied to the websockets only and has nothing to do with authentification.

The callback is parameterless on client and on the server, it will contains one parameter, the socket which has been connected/disconnected.

## Broadcasting

## Direct messages

## Rooms