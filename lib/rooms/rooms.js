// -------------------------------------------------------------------------- //
// -------------------------- Common interface ------------------------------ //
// -------------------------------------------------------------------------- //

/**
 * Represents the mongo collection which holds room objects
 */
Streamy.Rooms.model = new Mongo.Collection('streamy_rooms');

/**
 * Clear all empty rooms
 */
Streamy.Rooms.clearEmpty = function() {
  return Streamy.Rooms.model.remove({
    'session_ids': { $size: 0 }
  });
};

/**
 * Returns all rooms where the session id appears
 * @param  {String} sid Session id of the client
 * @return {Cursor}     Collection cursor
 */
Streamy.Rooms.allForSession = function(sid) {
  return Streamy.Rooms.model.find({
    'session_ids': sid
  });
};

/**
 * Returns an object for the targetted room name which contains an emit method
 * @param {String} room_name Room name to retrieve, if set to null returns the collection cursor
 * @return  {Object}  Object with an emit function
 */
Streamy.rooms = function(room_name) {
  if(!room_name)
    return Streamy.Rooms.model.find();

  return {
    emit: Streamy._roomsEmit(room_name)
  };
};

// -------------------------------------------------------------------------- //
// --------------------- Overriden by client/server ------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Join the given room name
 * @param  {String} room_name Room to join
 */
Streamy.join = function(room_name) { };

/**
 * Leave the given room
 * @param  {String} room_name Room name to leave
 */
Streamy.leave = function(room_name) { };

/**
 * Gets the wrapper for the emit returned by Streamy.rooms(room_name)
 * @param {String} room_name Room name
 * @return  {Function}  Function which will be called by emit on the room
 */
Streamy._roomsEmit = function(room_name) { };