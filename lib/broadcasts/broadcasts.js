// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Returns an object for the targetted session id which contains an emit method
 * @param {String} message Message to emit
 * @param {Object} data Data to send
 * @param {Array|String} except Which sid should we exclude from the broadcast message
 */
Streamy.broadcast = function(message, data, except) { };