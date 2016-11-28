# streamy: Directly use meteor streams with a friendly to use API.

The chat example is available live at [http://streamy.meteor.com](http://streamy.meteor.com/). It's not bug free yet but that's a pretty good example of what you can do with this package :)

## Installation

Simply add it to your project with:

```console
meteor add yuukan:streamy
```

**Note:** Meteor keeps logging warning with `_debug` about the message not being recognized because of [those lines](https://github.com/meteor/meteor/blob/c0aab1e8d3a5f01b4bedaa1c63dea3fc8f3db9b7/packages/ddp/livedata_connection.js#L259). You can override `Meteor._debug` to get rid of it (as shown in the [example](https://github.com/YuukanOO/streamy/blob/master/examples/chat/client/app.js#L1-7)).

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
```

## Core

### Streamy.emit(message_name, data_object, [socket])

Send a message with associated data to a socket. On the client, you do not need to provide the socket arg since it will use the client socket. On the server, **you must provide it**. If you want to send a message to all connected clients, you must use `Streamy.broadcast` (See Broadcasting).

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

### Streamy.off(message_name)

Un-register handler of a specific message.

### Streamy.close() Client-only

Un-register handlers of all messages on client.

### Streamy.onConnect(callback) / Streamy.onDisconnect(callback)

Register callbacks to be called upon connection, disconnection. Please note that this is tied to the websockets only and has nothing to do with authentification.

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
## Multiple servers support

Streamy comes with support for communication between multiple Meteor servers. When your app needs to connect to another Meteor server, if that server uses Streamy then communication by messages can be done easily just like between your server and client.

### Streamy.Connection(connection)

This is a constructor to create a Streamy connection. It requires one variable which is the connection to another Meteor server. This connection is the returned value when you connect to other Meteor server by [`DDP.connect`](https://docs.meteor.com/api/connections.html#DDP-connect). Instances of this constructor will be able to use these methods: `.on`, `.emit`, `.off`, `.onConnect`, `.onDisconnect`. They have the same effect with method having the same name of the `Streamy` object. Example:

```javascript
var connection = DDP.connect('localhost:4000');

var streamyConnection = new Streamy.Connection(connection);

// call when connect to localhost:4000 success
streamyConnection.onConnect(function() {
  console.log('Connected to localhost:4000');

  // send a message to localhost:4000
  streamyConnection.emit('hello', {
    data: 'world',
  });
});

// listen for message from localhost:4000
streamyConnection.on('data', function(data) {
  // ...
});

streamyConnection.onDisconnect(function() {
  console.log('Disconnected from localhost:4000');
});
```

### Streamy.Connection.prototype.on(message_name, callback)

Same as [Streamy.on](#streamyonmessage_name-callback)

### Streamy.Connection.prototype.off(message_name)

Same as [Streamy.off](#streamyoffmessage_name)

### Streamy.Connection.prototype.close()

Same as [Streamy.close](#streamyclose-client-only)

### Streamy.Connection.prototype.onConnect(callback) / Streamy.Connection.prototype.onDisconnect(callback)

Same as [Streamy.onConnect/Streamy.onDisconnect](#streamyonconnectcallback--streamyondisconnectcallback)

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
