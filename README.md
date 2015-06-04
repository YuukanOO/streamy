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
  // The server has added a __from property (client side) which contains the session id of the sender
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
Streamy.sessions(other_guy_sid).emit('private', { body: 'This is a private message' });
```

The server will add the property (client side) `data.__from` which contains the sender session id.

## Utilities

### Streamy.sockets([sid]) Server-only

If no parameter is given, returns all connected socket objects. Else it will try to retrieve the socket associated with the given sid.

### Streamy.id([socket])

Retrieve the connection id. A unique identifier for each connections. On the server, you should provide the socket object to retrieve the associated connection id.

### Streamy.userId([socket])

Retrieve meteor userId. On the server, you should provide the socket object to retrieve the associated userId.

### Streamy.user([socket])

Retrieve the meteor user. On the server, you should provide the socket object to retrieve the user associated.