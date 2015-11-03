// -------------------------------------------------------------------------- //
// ------------------------------ Allow/deny -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Wether or not the direct messages is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 * @param {Object} to Special object as returned by Streamy.sockets
 */
Streamy.DirectMessages.allow = function(data, from, to) {
  return true;
};

// -------------------------------------------------------------------------- //
// -------------------------------- Handlers -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Attach the direct message handler
 * @param {Object} data Data object
 * @param {Socket} from Socket emitter
 */
Streamy.on('__direct__', function(data, from) {

  // Check for sanity
  if(!data.__msg || !data.__data)
    return;

  var to_socks = null;

  if(data.__to_users)
    to_socks = Streamy.socketsForUsers(data.__to_users);
  else if(data.__to)
    to_socks = Streamy.sockets(data.__to);

  if(!to_socks)
    return;

  // Check if the server allows this direct message
  if(!Streamy.DirectMessages.allow(data, from, to_socks))
      return;

  // Attach the sender ID to the inner data
  data.__data.__from = Streamy.id(from);

  // And then emit the message
  Streamy.emit(data.__msg, data.__data, to_socks);
});

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy._sessionsEmit = function(sid) {
  var socket = _.isObject(sid) ? sid : Streamy.sockets(sid);

  return function(msg, data) {
    Streamy.emit(msg, data, socket);
  };
};

Streamy._sessionsForUsersEmit = function(uid) {
  uid = _.isArray(uid) ? uid : [uid];
  var sockets = Streamy.socketsForUsers(uid);

  return function(msg, data) {
    Streamy.emit(msg, data, sockets);
  };
};
