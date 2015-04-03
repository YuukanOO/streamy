// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.join = function(room_name) {
  Streamy.emit('__join__', {
    'name': room_name
  });
};

Streamy.leave = function(room_name) {
  Streamy.emit('__leave__', {
    'name': room_name
  });
};

Streamy._roomsEmit = function(room_name) {
  return function(msg, data) {
    Streamy.emit('__room__', {
      '__in': room_name,
      '__msg': msg,
      '__data': data
    });
  };
};