// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.id = function() {
  return Meteor.connection._lastSessionId;
};

Streamy.userId = function(socket) {
  if(!Meteor.userId)
    throw new Meteor.Error(500, 'Could not retrieve user id, is accounts-base installed?');
  
  return Meteor.userId();
};

Streamy.user = function(socket) {
  if(!Meteor.user)
    throw new Meteor.Error(500, 'Could not retrieve user, is accounts-base installed?');
    
  return Meteor.user();
};