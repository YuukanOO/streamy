// -------------------------------------------------------------------------- //
// ------------------------------ Allow/deny -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Wether or not the direct messages is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 * @param {Socket} to To socket
 */
Streamy.DirectMessages.allow = function(data, from, to) {
  return true;
};

/**
 * Wether or not the direct messages is denied
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 * @param {Socket} to To socket
 */
Streamy.DirectMessages.deny = function(data, from, to) {
  return false;
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
  if(!data.__to)
    return;
    
  var to_sock = Streamy.sockets(data.__to);
  
  // Check if the server allows this direct message
  if(!Streamy.DirectMessages.allow(data, from, to_sock) || Streamy.DirectMessages.deny(data, from, to_sock))
      return;
    
  // Attach the sender ID to the inner data
  data.__data.__from = from.id;
    
  // And then emit the message
  Streamy.sessions(data.__to).emit(data.__msg, data.__data);
});

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy._sessionsEmit = function(sid) {
  return function(msg, data) {
    Streamy.emit(msg, data, Streamy.sockets(sid));
  };
};