/**
 * Called upon a client connection, insert the user
 */
Streamy.onConnect(function(socket) {
  console.log('Connected', socket.id);

  Clients.insert({
    'sid': socket.id
  });
});

/**
 * Upon disconnect, clear the client database
 */
Streamy.onDisconnect(function(socket) {
  Clients.remove({
    'sid': socket.id
  });
});

/**
 * When the nick is set by the client, update the collection accordingly
 */
Streamy.on('nick_set', function(data, from) {
  if(!data.handle)
    throw new Meteor.Error('Empty nick');

  Clients.update({
    'sid': from.id
  }, {
    $set: { 'nick': data.handle }
  });

  // Inform the lobby
  Streamy.broadcast('__join__', {
    'sid': from.id,
    'room': 'lobby'
  });
});

/**
 * Only publish clients with not empty nick
 */
Meteor.publish('clients', function() {
  return Clients.find({
    'nick': { $ne: null }
  });
});

/**
 * Publish rooms where the user appears
 * @param  {String} sid) Client id
 */
Meteor.publish('rooms', function(sid) {
  if(!sid)
    return this.error(new Meteor.Error('sid null'));

  return Streamy.Rooms.allForSession(sid);
});