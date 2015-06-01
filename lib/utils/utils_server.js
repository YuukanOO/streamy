// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.userId = function(socket) {
  if(!socket)
    throw new Meteor.Error(500, 'You should provides a socket server-side');

  return Streamy._usersId[socket._meteorSession.id].get();
};

Streamy.user = function(socket) {
  if(!Meteor.users)
    throw new Meteor.Error(500, 'Could not retrieve user, is accounts-base installed?');
    
  return Meteor.users.findOne(Streamy.userId(socket));
};