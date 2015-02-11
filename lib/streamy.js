Yuukan = {};

Streamy = function() {
  
  function streamy() { }
  
  streamy._connect_handlers = [];
  streamy._disconnect_handlers = [];
  streamy._handlers = {};
  streamy._sessions = {};
  streamy._rooms = {};
  
  _.extend(streamy, this);
  
  // Call client/server specific initialization
  this.init.call(streamy);
  
  return streamy;
  
};

/**
 * Register a callback to call uppon connection.
 */
Streamy.prototype.onConnect = function(cb) {
  this._connect_handlers.push(cb);
};

/**
 * Register a callback to call uppon disconnection.
 */
Streamy.prototype.onDisconnect = function(cb) {
  this._disconnect_handlers.push(cb);
};

/**
 * Register a callback to call when the event name is emitted.
 */
Streamy.prototype.on = function(name, callback) {
  this._handlers[name] = callback;
};

/**
 * Emit the given event with associated data.
 */
Streamy.prototype.emit = function(name, data, to) {
  data = data || {};
  check(data, Object);
  data.msg = name;
  
  this._write(JSON.stringify(data), to);
};

// Package specific export
Yuukan.Streamy = Streamy;