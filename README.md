# streamy: Directly use meteor streams with a friendly to use API.

## Core API

### Streamy.onConnect(cb)

Register a callback to be called when the connection has been made.

```javascript
// Client
Streamy.onConnect(function() {
  // this <Streamy>
  console.log("I'm connected!");
});

// Server
Streamy.onConnect(function(socket) {
  // this <Streamy>
  console.log("Client connected", socket.headers['x-real-ip']);
});
```

### Streamy.on(event_name, cb)

Register a callback to be called when the message is received.

```javascript
// Client
Streamy.on('message_from_server', function(data) {
  // this <Streamy>
  console.log('Received from server:', data);
});

// Server
Streamy.on('message_from_client', function(data, socket) {
  // this <Streamy>
  console.log('Received from client', socket.headers['x-real-ip'], data);
});
```

### Streamy.emit(event_name, data, to)

Send a message for the given `event_name` with associated data.
On the server, `to` is used to specify on which socket the event should be write.

```javascript
// Client
Streamy.emit('message_from_client', {
  m: 'This message will be send to the server'
});

// Server
Streamy.on('message_from_client', function(data, socket) {
  console.log(data.m);
  
  this.emit('message_from_server', {
    m: 'Roger that!'
  }, socket);
});

```

## Sessions

Enable direct messages.

By default, the server allow direct messages, if you want to edit this behaviour, just override server-side methods:

- `Streamy.DirectMessages.allow: function(data, from) { return true; }`
- `Streamy.DirectMessages.deny: function(data, from) { return false; }`

### Streamy.sessions(sid)

Retrieve socket sessions. If `sid` is provided:

- On the client, it will returns a special object with an `emit` method to write a direct message (controlled by the server)
- On the server, it will returns the socket associated with this sid or else a mock

```javascript
// Client
Streamy.sessions('someSessionID').emit('hello', { name: 'John' });

// The true emitted object is:
{
  msg: '__direct__',
  __msg: 'hello',
  __data: { name: 'John' },
  __to: 'someSessionID'
}

// If the server allowed it, the receiver will receiver
{
  __from: 'emitterSessionID',
  name: 'John'
}

// Server
var all_sessions = Streamy.sessions();
var one_session = Streamy.sessions('someSessionID'); // Returns the socket
```

## BroadCasts

Broadcast a message to all connected clients.

By default, the server allow direct broadcasting, if you want to edit this behaviour, just override server-side methods:

- `Streamy.BroadCasts.allow: function(data, from) { return true; }`
- `Streamy.BroadCasts.deny: function(data, from) { return false; }`

```javascript
// Client
Streamy.broadcast('myMessage', { name: 'bob' });

// True real emitted object is
{
  msg: '__broadcast__',
  __msg: 'myMessage',
  __data: { name: 'bob' }
}

// Server
Streamy.broadcast('myMessage', { name: 'bob' });
```

## Rooms

Enable area communication.

### Streamy.join(room_name)

Join the given room.

```javascript
// Client
Streamy.join('pool');

// Server
Streamy.join('pool', user_socket); // Made the user join the given room name
```

### Streamy.rooms(room_name)

Retrieve a room wrapper to emit in this room only.

```javascript
// Client
Streamy.rooms('lodge').emit('my_msg', { my: 'data' });
```

### Streamy.isInRoom(room_name, [id])

Check if a user is in the given room. Client side, it only checks if Streamy._rooms[room_name] exists.

## Utils

### Streamy.userId(socket)

Helpers to retrieve the userId inside a streamy callback. On the server, you will need to give it the associated socket.

```javascript
// Client
Streamy.onConnect(function() {
  console.log("I'm connected!", this.userId());
});

// Server
Streamy.on('some-message', function(socket) {
  console.log("Client connected!", this.userId(socket));
});
```