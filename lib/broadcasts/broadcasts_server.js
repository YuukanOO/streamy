// -------------------------------------------------------------------------- //
// ------------------------------ Allow/deny -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Wether or not the broadcast is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 */
Streamy.BroadCasts.allow = function(data, from) {
  return true;
};

/**
 * Wether or not the broadcast is denied
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 */
Streamy.BroadCasts.deny = function(data, from) {
  return false;
};

// -------------------------------------------------------------------------- //
// -------------------------------- Handlers -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Attach the broadcast message handler
 * @param {Object} data Data object
 * @param {Socket} from Socket emitter
 */
Streamy.on('__broadcast__', function(data, from) {
  // Check if the server allows this direct message
  if(!Streamy.BroadCasts.allow(data, from) || Streamy.BroadCasts.deny(data, from))
      return;
    
  // Attach the sender ID to the inner data
  data.__data.__from = from.id;
    
  // And then emit the message
  Streamy.broadcast(data.__msg, data.__data, data.__except);
});

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.broadcast = function(message, data, except) {
  if(!_.isArray(except))
    except = [except];
  
  _.each(Streamy.sockets(), function(sock) {
    if(except.indexOf(sock.id) !== -1)
      return;
    
    Streamy.emit(message, data, sock);
  });
};