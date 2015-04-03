// -------------------------------------------------------------------------- //
// ------------------------------ Allow/deny -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Wether or not the room join is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 */
Streamy.Rooms.allowJoin = function(data, from) {
  return true;
};

/**
 * Wether or not the room leave is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 */
Streamy.Rooms.allowLeave = function(data, from) {
  return true;
};

/**
 * Wether or not a room message is allowed
 * @param {Object} data Data of the message
 * @param {Socket} from From socket
 */
Streamy.Rooms.allowMessage = function(data, from) {
  // Check if the user appears in this room
  return Streamy.Rooms.model.find({ 
    'name': data.__in, 
    'session_ids': from.id
  }).count() > 0;
};

/**
 * Called when an user has joined a room
 * @param  {String} room_name Room joined
 * @param  {Socket} socket    Socket which has joined this room
 */
Streamy.Rooms.onJoin = function(room_name, socket) {
  Streamy.rooms(room_name).emit('__join__', {
    'sid': socket.id,
    'room': room_name
  });
};

/**
 * Called when an user has left a room
 * @param  {String} room_name Room left
 * @param  {Socket} socket    Socket which has left this room
 */
Streamy.Rooms.onLeave = function(room_name, socket) {
  Streamy.rooms(room_name).emit('__leave__', {
    'sid': socket.id,
    'room': room_name
  });
};

// -------------------------------------------------------------------------- //
// -------------------------------- Handlers -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Attach the join message handler
 * @param {Object} data Data object
 * @param {Socket} from Socket emitter
 */
Streamy.on('__join__', function(data, from) {
  if(!data.name)
    return;

  // Check if the server allows joining
  if(!Streamy.Rooms.allowJoin(data, from))
      return;

  Streamy.join(data.name, from);
});

/**
 * Attach the leave message handler
 * @param {Object} data Data object
 * @param {Socket} from Socket emitter
 */
Streamy.on('__leave__', function(data, from) {
  if(!data.name)
    return;

  // Check if the server allows joining
  if(!Streamy.Rooms.allowLeave(data, from))
      return;

  Streamy.leave(data.name, from);
});

/**
 * Attach the room message handler
 * @param {Object} data Data object
 * @param {Socket} from Socket emitter
 */
Streamy.on('__room__', function(data, from) {

  // Check for sanity
  if(!data.__msg || !data.__data || !data.__in)
    return;
      
  // Check if the server allows this direct message
  if(!Streamy.Rooms.allowMessage(data, from))
      return;
        
  // And then emit the message
  Streamy.rooms(data.__in).emit(data.__msg, data.__data, from);
});

/**
 * Upon disconnect, leave all rooms for this socket
 */
Streamy.onDisconnect(function(socket) {
  var rooms = Streamy.Rooms.model.find({ 'session_ids': socket.id }).fetch();

  _.each(rooms, function(room) {
    Streamy.leave(room.name, socket);
  });
});

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.join = function(room_name, socket) {
  var selector = {};

  if(room_name)
    selector.name = room_name;

  Streamy.Rooms.model.upsert(selector, {
    $addToSet: { 'session_ids': socket.id }
  });

  Streamy.Rooms.onJoin(room_name, socket);
};

Streamy.leave = function(room_name, socket) {
  var selector = {};

  if(room_name)
    selector.name = room_name;

  Streamy.Rooms.model.update(selector, {
    $pull: { 'session_ids': socket.id }
  }, {
    multi: true
  });

  Streamy.Rooms.onLeave(room_name, socket);

  // Clear empty rooms
  Streamy.Rooms.clearEmpty();
};

Streamy._roomsEmit = function(room_name) {
  return function(msg, data, from) {

    // Ensure some fields
    data.__in = room_name;

    if(from)
      data.__from = from.id;

    var room = Streamy.Rooms.model.findOne({ 'name': room_name });

    if(room) {
      _.each(room.session_ids, function(to_sid) {
        Streamy.sessions(to_sid).emit(msg, data);
      });
    }
  };
};