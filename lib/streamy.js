Yuukan = {};

// Defines the Rooms collection used to manage rooms
Rooms = new Mongo.Collection('rooms');

Streamy = function() {
  
  function streamy() { }
  
  streamy._connect_handlers = [];
  streamy._disconnect_handlers = [];
  streamy._handlers = {};
  streamy._sessions = {};
  
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

/**
 * Check if an user is in the given room
 */
Streamy.prototype.isInRoom = function(room_name, id) {
  return Rooms.find({
    'name': room_name,
    'sessions': id
  }).count() > 0;
};

// Package specific export
Yuukan.Streamy = Streamy;