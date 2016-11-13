// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

function init(connection, self) {
  connection._stream.on('disconnect', function onClose() {
    // If it was previously connected, call disconnect handlers
    if(connection._stream.status().connected) {
      _.each(self.disconnectHandlers(connection), function forEachDisconnectHandler(cb) {
        cb.call(self);
      });
    }
  });

  // Attach message handlers
  connection._stream.on('message', function onMessage(data) {

    // Parse the message
    var parsed_data = JSON.parse(data);

    // Retrieve the msg value
    var msg = parsed_data.msg;

    // And dismiss it
    delete parsed_data.msg;

    // If its the connected message
    if(msg === 'connected') {
      // Call each handlers
      _.each(self.connectHandlers(connection), function forEachConnectHandler(cb) {
        cb.call(self);
      });
    } else if(msg) {
      // Else, call the appropriate handler
      self.handlers(msg, connection).call(self, parsed_data);
    }
  });
}

Streamy.init = function() {

  var self = this;
  init(Meteor.default_connection, self);

};

Streamy.initConnection = function(connection) {
  const self = this;
  if (connection) {
    connection._streamyConnectionId = Random.id();
    init(connection, self);
  }
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
