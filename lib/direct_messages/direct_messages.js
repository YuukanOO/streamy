// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Gets the wrapper for the emit returned by Streamy.sessions(sid)
 * @param {String|Array} sid Session id(s)
 * @return  {Function}  Function which will be called by emit on the session
 */
Streamy._sessionsEmit = function(sid) { };

/**
 * Gets the wrapper for the emit returned by Streamy.sessionsForUsers(sid)
 * @param {String|Array} uid User id(s)
 * @return  {Function}  Function which will be called by emit on the session
 */
Streamy._sessionsForUsersEmit = function(uid) { };

// -------------------------------------------------------------------------- //
// -------------------------- Common interface ------------------------------ //
// -------------------------------------------------------------------------- //

/**
 * Returns an object for the targetted session id(s) which contains an emit method
 * @param {String|Array} sid Session id(s)
 * @return  {Object}  Object with an emit function
 */
Streamy.sessions = function(sid) {
  return {
    emit: Streamy._sessionsEmit(sid)
  };
};

/**
 * Returns an object for the targetted user id(s) which contains an emit method
 * @param {String|Array} uid User id(s)
 * @return  {Object}  Object with an emit function
 */
Streamy.sessionsForUsers = function(uid) {
  return {
    emit: Streamy._sessionsForUsersEmit(uid)
  }
};
