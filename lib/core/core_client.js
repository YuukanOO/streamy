// NOTE: Init _streamyConnectionId for the default connection
Meteor.default_connection._streamyConnectionId = 'default';

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.init = function() {
  Streamy._initConnection(Meteor.default_connection);
};

Streamy._write = function(data, to) {
  // Send to a socket connection if supplied, otherwise send to the default server
  if (to && to._stream) {
    to._stream.send(data);
    return;
  }
  Meteor.default_connection._stream.send(data);
};

/**
 * Un-register handlers of all messages on client
 */
Streamy.close = function() {
  var handlers = Streamy.handlers();
  for (var func in handlers) {
    if (handlers.hasOwnProperty(func)) {
      delete handlers[func];
    }
  }
};
