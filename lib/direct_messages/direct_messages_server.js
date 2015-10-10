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
  if(!data.__msg || !data.__data || !data.__to)
    return;
  
  var to_sock = Streamy.sockets(data.__to);
  
  // Check if the server allows this direct message
  if(!Streamy.DirectMessages.allow(data, from, to_sock))
      return;

  // Attach the sender ID to the inner data
  data.__data.__from = Streamy.id(from);
        
  // And then emit the message
  Streamy.sessions(to_sock).emit(data.__msg, data.__data);
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

Streamy.groupEmit = function(message, data, to) {
  _.each(to, function(socket) {
    Streamy.emit(message, data, socket);
  });
};
