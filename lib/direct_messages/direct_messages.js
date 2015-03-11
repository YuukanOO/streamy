// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Gets the wrapper for the emit returned by Streamy.sessions(sid)
 * @param {String} sid Session id
 * @return  {Function}  Function which will be called by emit on the session
 */
Streamy._sessionsEmit = function(sid) { };

// -------------------------------------------------------------------------- //
// -------------------------- Common interface ------------------------------ //
// -------------------------------------------------------------------------- //

/**
 * Returns an object for the targetted session id which contains an emit method
 * @return  {Object}  Object with an emit function
 */
Streamy.sessions = function(sid) {
  return {
    emit: Streamy._sessionsEmit(sid)
  };
};