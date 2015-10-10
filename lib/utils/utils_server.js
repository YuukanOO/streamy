// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.id = function(socket) {
  return socket.__sid;
};

Streamy.userId = function(socket) {
  if(!socket)
    throw new Meteor.Error(500, 'You should provides a socket server-side');

  return Streamy._usersId[Streamy.id(socket)].get();
};

Streamy.user = function(socket) {
  if(!Meteor.users)
    throw new Meteor.Error(500, 'Could not retrieve user, is accounts-base installed?');
    
  return Meteor.users.findOne(Streamy.userId(socket));
};

Streamy.userSockets = function(user_ids) {
  return _.filter(Streamy.sockets(), function(socket) {
    return user_ids.indexOf(socket._meteorSession.userId) != -1;
  });
};
