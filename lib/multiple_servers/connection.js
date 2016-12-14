/**
 * Streamy Connection constructor: init a DDP connection to work with Streamy
 * @param {Object} DDP connection created by DDP.connect
 */

Streamy.Connection = function(connection) {
  var self = this;
  var _handlers = {};
  var _connectHandlers = [];
  var _disconnectHandlers = [];
  var _connection = connection;

  // XXX: Are there any ways to make sure connection is created by DDP.connect?
  if (!connection ||
    typeof connection !== 'object' ||
    typeof connection._stream !== 'object' ||
    typeof connection._stream.on !== 'function' ||
    typeof connection._stream.status !== 'function'
  ) {
    throw new Meteor.Error('WrongType', 'Connection has to be created by DDP.connect');
  }

  self._getConnection = function _getConnection() {
    return _connection;
  };

  self._setHandler = function _setHandler(msg, callback) {
    _handlers[msg] = callback;
  };

  self._deleteHandler = function _deleteHandler(msg) {
    delete _handlers[msg];
  };

  self._deleteHandlers = function _deleteHandlers() {
    for (var func in _handlers) {
      if (_handlers.hasOwnProperty(func)) {
        delete _handlers[func];
      }
    }
  };

  self._addConnectHandlers = function _addConnectHandlers(callback) {
    _connectHandlers.push(callback);
  };

  self._addDisconnectHandlers = function _addDisconnectHandlers(callback) {
    _disconnectHandlers.push(callback);
  };

  _connection._stream.on('disconnect', function onClose() {
    // If it was previously connected, call disconnect handlers
    if(_connection._stream.status().connected) {
      _.each(_disconnectHandlers, function forEachDisconnectHandler(cb) {
        cb.call(self);
      });
    }
  });

  // Attach message handlers
  _connection._stream.on('message', function onMessage(data) {

    // Parse the message
    var parsed_data = JSON.parse(data);

    // Retrieve the msg value
    var msg = parsed_data.msg;

    // And dismiss it
    delete parsed_data.msg;

    // If its the connected message
    if(msg === 'connected') {
      // Call each handlers
      _.each(_connectHandlers, function forEachConnectHandler(cb) {
        cb.call(self);
      });
    } else if(msg) {
      // Else, call the appropriate handler
      var f = _handlers[msg] || function() {};
      f.call(self, parsed_data);
    }
  });
};

/**
 * Register an handler for the given message type
 * @param {String} message Message name to handle
 * @param {Function} callback Callback to call when this message is received
 */
Streamy.Connection.prototype.on = function(message, callback) {
  check(message, String);

  if (typeof callback !== 'function') {
    throw new Meteor.Error('WrongType', 'Message handler has to be a function');
  }

  message = Streamy._applyPrefix(message);
  this._setHandler(message, Meteor.bindEnvironment(callback));
};

/**
 * Un-register an handler for the given message type
 * @param {String} message Message name to handle
 */

Streamy.Connection.prototype.off = function(message) {
  check(message, String);

  message = Streamy._applyPrefix(message);
  this._deleteHandler(message);
};

/**
 * Un-register handlers of all messages
 */

Streamy.Connection.prototype.close = function() {
  this._deleteHandlers();
};

/**
 * Emits a message with the given name and associated data
 * @param {String} message Message name to emit
 * @param {Object} data Data to send
 */
Streamy.Connection.prototype.emit = function(message, data) {
  data = data || {};

  check(message, String);
  check(data, Object);

  message = Streamy._applyPrefix(message);

  data.msg = message;
  this._getConnection()._stream.send(JSON.stringify(data));
};

/**
 * Adds an handler for the connection success
 * @param {Function} callback Callback to call upon connection
 */
Streamy.Connection.prototype.onConnect = function(callback) {

  if (typeof callback !== 'function') {
    throw new Meteor.Error('WrongType', 'Connect handler has to be a function');
  }

  this._addConnectHandlers(Meteor.bindEnvironment(callback));
};

/**
 * Adds an handler for the disconnection
 * @param {Function} callback Callback to call upon disconnect
 */

Streamy.Connection.prototype.onDisconnect = function(callback) {

  if (typeof callback !== 'function') {
    throw new Meteor.Error('WrongType', 'Disconnect handler has to be a function');
  }

  this._addDisconnectHandlers(Meteor.bindEnvironment(callback));
};
