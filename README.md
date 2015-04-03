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

The callback is parameterless on client. On the server, it will contains one parameter, the socket which has been connected/disconnected.

## Broadcasting

Streamy allow you to use broadcasting (ie. Send a message to every connected sessions).

You can control wether or not this is activated by overriding this method on the server:

```javascript
Streamy.BroadCasts.allow = function(data, from) {
  // from is the socket object
  // data contains raw data you can access:
  //  - the message via data.__msg
  //  - the message data via data.__data

  return true;
};
```

Every specific features after this line works the same way using the above core methods. When you call `broadcast`, `sessions` or `rooms`, this is the flow:

- Wrap your message in a specific message (__direct__, __broadcast__, __room__, __join__, __leave__)
- The above specific messages are handled by the server
- It call the appropriate `allow` method to determine if it must continue
- If `allow` returns true, send the message to concerned sessions

### Streamy.broadcast(message_name, data, [except_sids])

Broadcast the given message to all connected sessions. If you specify excepted_sids (Array or String), it will excludes those session id to the broadcast.

```javascript
// Client and server.

Streamy.on('my_message_type', function(data) {
  // The server has added a __from property which contains the session id of the sender
  console.log('A broadcast message', data);
});

Streamy.broadcast('my_message_type', { my_data: 'testing broadcasting' });
```

## Direct messages

Send a direct message to a session.

You can control wether or not this is activated by overriding this method on the server:

```javascript
Streamy.DirectMessages.allow = function(data, from, to) {
  // from is the socket object
  // to is the recipient socket object
  // data contains raw data you can access:
  //  - the message via data.__msg
  //  - the message data via data.__data

  return true;
};
```

### Streamy.sessions(sid)

Returns a special object which contains one method: `emit` which works the same as the `core#emit` method. On the server, you can also send a socket in place of the sid parameter.

```javascript
// On the server
Streamy.on('some_message', function(data, from) {
  Streamy.sessions(from/** or from.id */).emit('pong', {});
});

// On the client
Streamy.sessions(other_guy_sid).emit('private', { body: 'This is a private message' });
```

The server will add the property `data.__from` which contains the sender session id.

## Rooms

This one is a bit more complicated. It let you sends messages to specific rooms. Rooms are stored in a Mongo collection named `streamy_rooms` and is available through `Streamy.Rooms.model`.

A room record is described as follow:

```json
{
  "_id": "mongo id",
  "name": "The room name",
  "session_ids": [
    "Every connected",
    "session IDs"
  ]
}
```

You can control the behaviour of the room feature by overriding this methods on the server:

```javascript
// Wether or not an user can join a room
Streamy.Rooms.allowJoin = function(data, from) {
  // from is the socket object
  // data contains raw data you can access:
  //  - the room name via data.name
  //  - the message via data.__msg
  //  - the message data via data.__data

  return true;
};

// Wether or not an user can leave a room
Streamy.Rooms.allowLeave = function(data, from) {
  // from is the socket object
  // data contains raw data you can access:
  //  - the room name via data.name
  //  - the message via data.__msg
  //  - the message data via data.__data

  return true;
};

// Called when a user wants to send a message in this room
Streamy.Rooms.allowMessage = function() {
  // from is the socket object
  // data contains raw data you can access:
  //  - the room name via data.__in
  //  - the message via data.__msg
  //  - the message data via data.__data

  // Check if the user appears in this room, this is the default implementation
  return Streamy.Rooms.model.find({ 
    'name': data.__in, 
    'session_ids': from.id
  }).count() > 0;
}
```

By default, when a user join or leave a room, the server will send notifications (`__join__` and `__leave__` messages) to sessions in the same room. You can override the below methods:

```javascript
Streamy.Rooms.onJoin = function(room_name, socket) {
  Streamy.rooms(room_name).emit('__join__', {
    'sid': socket.id,
    'room': room_name
  });
};

Streamy.Rooms.onLeave = function(room_name, socket) {
  Streamy.rooms(room_name).emit('__leave__', {
    'sid': socket.id,
    'room': room_name
  });
};
```

### Streamy.join(room_name)

Join the given room. This call will created the room if needed and add the session id to this room model.

### Streamy.leave(room_name)

Leave the given room. Remove the session id from the room record.

### Streamy.rooms([room_name])

Used as `Streamy.sessions`, if no argument is provided, it will returns the collection cursor containing all rooms. If you give a name, it will returns an object which contains an `emit` method which works the same as the `core#emit` method.

Please note that in order for this method to work, you should hava successfuly joined this room via `Streamy.join` first.

```javascript
Streamy.rooms('my_room').emit('my_message', {});
```