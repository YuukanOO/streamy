# streamy: Directly use meteor streams with a friendly to use API.

The chat example is available live at [http://streamy.meteor.com](http://streamy.meteor.com/). It's not bug free yet but that's a pretty good example of what you can do with this package :)

## Installation

Simply add it to your project with:

```console
meteor add yuukan:streamy
```

**Note:** Meteor keeps logging warning with `_debug` about the message not being recognized because of [those lines](https://github.com/meteor/meteor/blob/c0aab1e8d3a5f01b4bedaa1c63dea3fc8f3db9b7/packages/ddp/livedata_connection.js#L259). You can override `Meteor._debug` to get rid of it (as shown in the [example](https://github.com/YuukanOO/streamy/blob/master/examples/chat/client/app.js#L1-7)).

**Note:** Streamy now supports to work with **multiple DDP servers**. The API is updated but still be compatible with older versions.

## Basic Usage

```javascript
// Send a message to all connected sessions (Client & server)
Streamy.broadcast('hello', { data: 'world!' });

// Attach an handler for a specific message
Streamy.on('hello', function(d, s) {
  console.log(d.data); // Will print 'world!'

  // On the server side only, the parameter 's' is the socket which sends the message, you can use it to reply to the client, see below
});

// Send a message
// from client to server
Streamy.emit('hello', { data: 'world!' });

// from server to client, you need an instance of the client socket (retrieved inside an 'on' callback or via `Streamy.sockets(sid)`)
Streamy.emit('hello', { data: 'world!' }, s);

// Send a message to another DDP server (client & server)
const connection = DDP.connect('external_ddp_server');
Streamy.initConnection(connection);

Streamy.emit('hello', {
  data: 'world!',
}, connection)

// Listen on message comes from another DDP server
Streamy.on('hello', function(d) {
  // d is the data sent from external_ddp_server
}, connection);

```

## Core

### Streamy.initConnection(ddp_connection) (multiple servers support)

Initialize an external DDP connection (create by DDP.connect) to work with Streamy. The DDP connection have be initialized before emitting messages and attaching message handlers

### Streamy.clearConnection(ddp_connection) (multiple servers support)

De-initialize an external DDP connection which was initialized by `Streamy.initConnection`. If your app connects to a DDP server, initialize it with `Streamy.initConnection` and start listening messages from that server. After communication, you should use this function to clean up the memory especially on server

### Streamy.emit(message_name, data_object, [socket/ddp_connection])

Send a message with associated data to a socket.
On client, the third argument is optional. If you do not provide the third args, the message will be sent to the default Meteor server. To send message to another DDP server (not the default Meteor server), provide the DDP connection to that server as the third argument of `Streamy.emit`

```javascript
// send message to default Meteor server
Streamy.emit('streamy_test_default_server', {
  foo: 'bar',
});

// send message to external DDP server
const connection = DDP.connect('external_ddp_server');
Streamy.initConnection(connection);

Streamy.emit('streamy_test_external_server', {
  foo: 'bar',
}, connection);
```

On server, you have to provide the third argument. It can be either a socket connected to your server or an DDP connection to other DDP servers. If you want to send a message to all connected clients, you must use `Streamy.broadcast` (See Broadcasting).

### Streamy.on(message_name, callback, [ddp_connection])

Register a callback for a specific message. The callback will be called when a message of this type has been received.
The third argument is used to specify the DDP connection you want to listen on, listen on Meteor default connection if not specified

```javascript
// Client

// Listen on default Meteor server
Streamy.on('my_message', function(data) {
  console.log(data);
});

// Listen on external DDP server
const connection = DDP.connect('external_ddp_server');
Streamy.initConnection(connection);
Streamy.on('my_message', function(data) {
  console.log(data);
}, connection);


// Server

// Listen on messages come from connected clients
Streamy.on('my_message', function(data, from) {
  // from is a Socket object
  Streamy.emit('pong', {}, from); // An example of replying to a message
});

// Listen on external DDP server.
// This is the same as client actually, because when your server connect to another DDP server it becomes a client of that server
const connection = DDP.connect('external_ddp_server');
Streamy.initConnection(connection);
Streamy.on('my_message', function(data) {
  console.log(data);
}, connection);

```

### Streamy.off(message_name, [ddp_connection])

Un-register handler of a specific message from a specific DDP server. Use Meteor default server if `ddp_connection` is not specified

### Streamy.close() Client-only

Un-register handlers of all messages on client.

### Streamy.onConnect(callback, [ddp_connection]) / Streamy.onDisconnect(callback, [ddp_connection])

Register callbacks to be called upon connection/disconnection of a DDP connection, use Meteor default connection as default.
Please note that this is tied to the websockets only and has nothing to do with authentification.

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

Every specific features after this line works the same way using the above core methods. When you call `broadcast` or `sessions`, this is the flow:

- Wrap your message in a specific message (__direct__, __broadcast__, __room__, __join__, __leave__)
- The above specific messages are handled by the server
- It call the appropriate `allow` method to determine if it must continue
- If `allow` returns true, send the message to concerned sessions

### Streamy.broadcast(message_name, data, [except_sids])

Broadcast the given message to all connected sessions. If you specify excepted_sids (Array or String), it will excludes those session id to the broadcast.

```javascript
// Client and server.

Streamy.on('my_message_type', function(data) {
  // The server has added a __from and __fromUserId properties (client side) which contain the session id and userId of the sender respectively
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
  Streamy.sessions(from/** or Streamy.id(from) */).emit('pong', {});
});

// On the client
// You could also give it an array of sessions ids
Streamy.sessions(other_guy_sid).emit('private', { body: 'This is a private message' });
```

The server will add the property (client side) `data.__from` which contains the sender session id.

### Streamy.sessionsForUsers(uid)

This method behaves similarly to `sessions`, however it looks up the sessions based on user id(s). It returns a special object which contains one method: `emit` which works the same as the `core#emit` method.

## Utilities

### Streamy.sockets([sid]) Server-only

If no parameter is given, returns all connected socket objects. If a string or an array of strings is provided it will returns a special object with a `send` method and matched sockets in `_sockets`.

### Streamy.socketsForUsers([uid]) Server-only

Behave similarly to `sockets`, however it looks up the sockets based on user id(s).

### Streamy.id([socket])

Retrieve the connection id. A unique identifier for each connections. On the server, you should provide the socket object to retrieve the associated connection id.

### Streamy.userId([socket])

Retrieve meteor userId. On the server, you should provide the socket object to retrieve the associated userId. It will return a reactive object. To keep track of user states on the server, you could do something like this:

```javascript
Streamy.onConnect(function(socket) {
  Tracker.autorun(function() {
    var uid = Streamy.userId(socket); // uid will be null if the user is not logged in, otherwise, it will take the userId value

    console.log("New userId state for", Streamy.id(socket), uid);
  });
});
```

### Streamy.user([socket])

Retrieve the meteor user. On the server, you should provide the socket object to retrieve the user associated.
