/**
 * Send a message to all client except the one with the given socket id (if any)
 */
function sendToAll(msg, data, except_id) {
  var clients = Streamy.sessions();
  
  _.each(clients, function(cli) {
    if(cli.id !== except_id) {
      Streamy.emit(msg, data, cli);
    }
  });
}

/**
 * On connection, give the user a name and notifify connected users
 */
Streamy.onConnect(function(socket) {
  var new_nick = socket.id;
  
  socket.nick = new_nick;
  
  this.emit('nick', { 'new_nick': socket.nick }, socket);
  
  sendToAll('message', {
    'content': socket.nick + ' has join',
    'from': 'server'
  }, socket.id);
});

/**
 * On disconnect, notify other users
 */
Streamy.onDisconnect(function(socket) {
  sendToAll('message', {
    'content': socket.nick + ' has left',
    'from': 'server'
  }, socket.id);
});

/**
 * When it receives a message, dispatch it to all clients
 */
Streamy.on('message', function(data, from) {
  sendToAll('message', {
    'content': data.content,
    'from': from.nick
  }, from.id);
});