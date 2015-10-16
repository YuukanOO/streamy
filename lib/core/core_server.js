var sessions = {};

// -------------------------------------------------------------------------- //
// ------------------------------- Accessors -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Contains reactive variables for each connection id/user id
 * @type {Object}
 */
Streamy._usersId = {};

/**
 * Retrieve server connected sockets or one in particular
 * @param {String} sid Optional, socket id to retrieve
 * @return  {Socket}  The socket object
 */
Streamy.sockets = function(sid) {
  if(sid) {
    var sock = sessions[sid];
    if(!sock) // If not found creates a mock
      sock = {
        send: function() { }
      };
      
    return sock;
  }
  
  return sessions;
};

/**
 * Retrieve server connected sockets or one in particular by userId
 * @param {String|Array} userIds, A single userId or an array of userIds to retrieve
 * @return  {Object}  A special object with an emit method, that will send the passed in data to all matched sockets
 */
Streamy.sessionsForUsers = function(user_ids) {
  if (typeof(user_ids) === 'string') user_ids = [user_ids];

  var user_sessions = _.chain(Streamy.sockets()).filter(function(socket) {
    return user_ids.indexOf(socket._meteorSession.userId) != -1;
  }).map(function(socket) {
    return Streamy.sessions(socket)
  }).value();

  return {
    emit: function(msg, data) {
      _.each(user_sessions, function(user_session) {
        user_session.emit(msg, data);
      });
    }
  };
}

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.init = function() {
  var self = this;

  // If accounts package is installed, register for successful login attempts
  if(typeof(Accounts) !== 'undefined' ) {
    Accounts.onLogin(function onLoggedIn(data) {
      Streamy._usersId[data.connection.id].set(data.user._id);
    });
  }
  
  // When a new connection has been received
  Meteor.default_server.stream_server.register(function onNewConnected(socket) {
    var handlers_registered = false;
    
    // On closed, call disconnect handlers
    socket.on('close', function onSocketClosed() {
      if(handlers_registered) {
        var sid = Streamy.id(socket);

        delete sessions[sid];
        delete Streamy._usersId[sid];
        
        _.each(self.disconnectHandlers(), function forEachDisconnectHandler(cb) {
          cb.call(self, socket);
        });
      }
    });
    
    // This little trick is used to register protocol handlers on the 
    // socket._meteorSession object, so we need it to be set
    socket.on('data', function onSocketData(raw_data) {
      
      // Since we doesn't have a Accounts.onLogout callback, we must use this little trick, will be replaced when a proper callback is added
      if(JSON.parse(raw_data).method === 'logout' && socket.__sid) {
        Streamy._usersId[Streamy.id(socket)].set(null);
      }

      // Only if the socket as a meteor session
      if(!handlers_registered && socket._meteorSession) {

        // Store the meteorSesion id in an inner property since _meteorSession will be deleted upon socket closed
        socket.__sid = socket._meteorSession.id;

        var sid = Streamy.id(socket);

        handlers_registered = true;
        
        sessions[sid] = socket;
        Streamy._usersId[sid] = new ReactiveVar(null);
        
        // Call connection handlers
        _.each(self.connectHandlers(), function forEachConnectHandler(cb) {
          cb.call(self, socket);
        });

        // Add each handler to the list of protocol handlers
        _.each(self.handlers(), function forEachHandler(cb, name) {
          if(!socket._meteorSession.protocol_handlers[name]) {
            socket._meteorSession.protocol_handlers[name] = function onMessage(raw_msg) {
              delete raw_msg.msg; // Remove msg field
              cb.call(self, raw_msg, this.socket);
            };
          }
        });
      }
    });
  });
};

Streamy._write = function(data, to) {
  if(to)
    to.send(data);
};
