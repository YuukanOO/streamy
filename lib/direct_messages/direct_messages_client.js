// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy._sessionsEmit = function(sid) {
  return function(msg, data) {
    Streamy.emit('__direct__', {
      '__to': sid,
      '__msg': msg,
      '__data': data
    });
  };
};

Streamy._sessionsForUsersEmit = function(uid) {
  return function(msg, data) {
    Streamy.emit('__direct__', {
      '__to_users': uid,
      '__msg': msg,
      '__data': data
    });
  };
}
