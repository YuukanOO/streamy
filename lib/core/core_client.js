// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.init = function() {

  var self = this;

  // Uppon close
  Meteor.default_connection._stream.on('disconnect', function onClose() {
    // If it was previously connected, call disconnect handlers
    if(Meteor.default_connection._stream.status().connected) {
      _.each(self.disconnectHandlers(), function forEachDisconnectHandler(cb) {
        cb.call(self);
      });
    }
  });

  // Attach message handlers
  Meteor.default_connection._stream.on('message', function onMessage(data) {

    // Parse the message
    var parsed_data = JSON.parse(data);

    // Retrieve the msg value
    var msg = parsed_data.msg;

    // And dismiss it
    delete parsed_data.msg;

    // If its the connected message
    if(msg === 'connected') {
      // Call each handlers
      _.each(self.connectHandlers(), function forEachConnectHandler(cb) {
        cb.call(self);
      });
    }
    else if(msg) {
      // Else, call the appropriate handler
      self.handlers(msg).call(self, parsed_data);
    }
  });


};

Streamy._write = function(data) {
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
