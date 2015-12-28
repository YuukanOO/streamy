var handlers = {};
var connect_handlers = [];
var disconnect_handlers = [];

// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Init streamy, attach base handlers in client/server
 * @param {Object} options User options (see Streamy.setInitOptions())
 */
Streamy.init = function(options) { };

/**
 * Write the message on the socket
 * @param {String} data Data stringified
 * @param {Object} to (Server side) Which socket should we use
 */
Streamy._write = function(data, to) { };

// -------------------------------------------------------------------------- //
// ------------------------------ Accessors --------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Retrieve connect handlers
 */
Streamy.connectHandlers = function() {
  return connect_handlers;
};

/**
 * Retrieve disconnect handlers
 */
Streamy.disconnectHandlers = function() {
  return disconnect_handlers;
};

/**
 * Retrieve all handlers or the one for the given message
 * @param {String} message Optional, if defined, returns the handler for this specific messsage
 */
Streamy.handlers = function(message) {
  if(message) {
    var handler = handlers[message];
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
 * Set the options to be passed to Streamy.init()
 * @param {Object} options Configure options passed to Streamy.init()
 */
Streamy.setInitOptions = function(options) {
  this._options = options;
};

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
Streamy.on = function(message, callback) {
  message = Streamy._applyPrefix(message);
  handlers[message] = Meteor.bindEnvironment(callback);
};

/**
 * Adds an handler for the connection success
 * @param {Function} callback Callback to call upon connection
 */
Streamy.onConnect = function(callback) {
  connect_handlers.push(Meteor.bindEnvironment(callback));
};

/**
 * Adds an handler for the disconnection
 * @param {Function} callback Callback to call upon disconnect
 */
Streamy.onDisconnect = function(callback) {
  disconnect_handlers.push(Meteor.bindEnvironment(callback));
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
