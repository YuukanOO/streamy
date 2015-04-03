// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Retrieve the user id
 * @param {Socket} socket On server, should be given to determine the concerned user
 */
Streamy.userId = function(socket) {};

/**
 * Retrieve the user
 * @param {Socket} socket On server, should be given to determine the concerned user
 */
Streamy.user = function(socket) {};