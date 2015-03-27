/**
 * Represents the mongo collection which holds room objects
 */
Streamy.Rooms.model = new Mongo.Collection('streamy_rooms');

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