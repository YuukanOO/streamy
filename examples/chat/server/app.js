/**
 * Called upon a client connection, insert the user
 */
Streamy.onConnect(function(socket) {
  Clients.insert({
    'sid': Streamy.id(socket)
  });
});

/**
 * Upon disconnect, clear the client database
 */
Streamy.onDisconnect(function(socket) {
  Clients.remove({
    'sid': Streamy.id(socket)
  });

  // Inform the lobby
  Streamy.broadcast('__leave__', {
    'sid': Streamy.id(socket),
    'room': 'lobby'
  });
});

/**
 * When the nick is set by the client, update the collection accordingly
 */
Streamy.on('nick_set', function(data, from) {
  if(!data.handle)
    throw new Meteor.Error('Empty nick');

  Clients.update({
    'sid': Streamy.id(from)
  }, {
    $set: { 'nick': data.handle }
  });

  // Ack so the user can proceed to the rooms page
  Streamy.emit('nick_ack', { 'nick': data.handle }, from);

  // Inform the lobby
  Streamy.broadcast('__join__', {
    'sid': Streamy.id(from),
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