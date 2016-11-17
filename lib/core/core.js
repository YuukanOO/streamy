var handlers = {
  // NOTE: message handlers of default connection
  default: {},
};
var connect_handlers = {
  // NOTE: connect handlers of default connection
  default: [],
};
var disconnect_handlers = {
  // NOTE: disconnect handlers of default connection
  default: [],
};

// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Init streamy, attach base handlers in client/server
 */
Streamy.init = function() { };

/**
 * Write the message on the socket
 * @param {String} data Data stringified
 * @param {Object} to (Server side) Which socket should we use
 */
Streamy._write = function(data, to) { };

/**
 * Init a DDP connection to work with streamy
 * @param {Object} the DDP connection (created with DDP.connect)
 */
Streamy._initConnection = function(connection) {
  var self = this;
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
};

/**
 * Public API to init a DDP connection
 * @param {Object} the DDP connection (created with DDP.connect)
 */
Streamy.initConnection = function(connection) {
  if (connection) {
    connection._streamyConnectionId = Random.id();
    Streamy._initConnection(connection);
  }
};

/**
 * Clean up a DDP connection which was init to work with Streamy
 * This function will remove all handlers attached to the connection
 * @param {Object} the DDP connection (created with DDP.connect)
 */
Streamy.clearConnection = function(connection) {
  if (connection && connection._streamyConnectionId) {
    var id = connection._streamyConnectionId;
    delete handlers[id];
    delete connect_handlers[id];
    delete disconnect_handlers[id];
  }
};

// -------------------------------------------------------------------------- //
// ------------------------------ Accessors --------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Retrieve connect handlers
 * @param {Object} the connection to get connect handlers of
 */
Streamy.connectHandlers = function(connection) {
  if (connection) {
    return connect_handlers[connection._streamyConnectionId];
  }
  return [];
};

/**
 * Retrieve disconnect handlers
 * @param {Object} the connection to get disconnect handlers of
 */
Streamy.disconnectHandlers = function(connection) {
  if (connection) {
    return disconnect_handlers[connection._streamyConnectionId];
  }
  return [];
};

/**
 * Retrieve all handlers or the one for the given message
 * @param {String} message Optional, if defined, returns the handler for this specific messsage
 */
Streamy.handlers = function(message, connection) {
  if(message) {
    var handler;
    if (connection && connection._streamyConnectionId) {
      var connectionHandlers = handlers[connection._streamyConnectionId];
      handler = connectionHandlers && connectionHandlers[message];
    } else {
      handler = handlers.default[message];
    }

    if(!handler)
      handler = function() {};

    return handler;
  }

  return handlers;
};

// -------------------------------------------------------------------------- //
// -------------------------- Common interface ------------------------------ //
// -------------------------------------------------------------------------- //

/**
 * Apply a specific prefix to avoid name conflicts
 * @param {String} value Base value
 * @return {String} The base value prefixed
 */
Streamy._applyPrefix = function(value) {
  return 'streamy$' + value;
};

/**
 * Register an handler for the given message type
 * @param {String} message Message name to handle
 * @param {Function} callback Callback to call when this message is received
 */
Streamy.on = function(message, callback, connection) {
  message = Streamy._applyPrefix(message);
  if (connection && connection._streamyConnectionId) {
    if (!handlers[connection._streamyConnectionId]) {
      handlers[connection._streamyConnectionId] = {};
    }
    handlers[connection._streamyConnectionId][message] = Meteor.bindEnvironment(callback);
  } else {
    handlers.default[message] = Meteor.bindEnvironment(callback);
  }
};

/**
 * Un-register an handler for the given message type
 * @param {String} message Message name to handle
 */
Streamy.off = function(message, connection) {
   message = Streamy._applyPrefix(message);
   if (connection && connection._streamyConnectionId) {
     delete handlers[connection._streamyConnectionId][message];
   } else {
     delete handlers.default[message];
   }
 };

/**
 * Adds an handler for the connection success
 * @param {Function} callback Callback to call upon connection
 * @param {Object} the DDP connection to listen on
 */
Streamy.onConnect = function(callback, connection) {
  if (!connection) {
    if (Meteor.isServer) {
      connection = Meteor.default_server.stream_server;
    } else {
      connection = Meteor.default_server.stream_server;
    }
  }

  if (!connect_handlers[connection._streamyConnectionId]) {
    connect_handlers[connection._streamyConnectionId] = [];
  }
  connect_handlers[connection._streamyConnectionId].push(Meteor.bindEnvironment(callback));
};

/**
 * Adds an handler for the disconnection
 * @param {Function} callback Callback to call upon disconnect
 * @param {Object} the DDP connection to listen on
 */
Streamy.onDisconnect = function(callback, connection) {
  if (!connection) {
    if (Meteor.isServer) {
      connection = Meteor.default_server.stream_server;
    } else {
      connection = Meteor.default_server.stream_server;
    }
  }

  if (!disconnect_handlers[connection._streamyConnectionId]) {
    disconnect_handlers[connection._streamyConnectionId] = [];
  }
  disconnect_handlers[connection._streamyConnectionId].push(Meteor.bindEnvironment(callback));
};

/**
 * Emits a message with the given name and associated data
 * @param {String} message Message name to emit
 * @param {Object} data Data to send
 * @param {Socket} to (Server side only) which socket we should use
 */
Streamy.emit = function(message, data, to) {
  data = data || {};
  message = Streamy._applyPrefix(message);

  check(message, String);
  check(data, Object);

  data.msg = message;

  Streamy._write(JSON.stringify(data), to);
};
