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

// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.init = function() {
  var self = this;

  // If accounts package is installed, register for successful login/logout attempts
  if(Accounts) {
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
    socket.on('data', function onSocketData() {
      
      // Only if the socket as a meteor session
      if(!handlers_registered && socket._meteorSession) {

        // Store the meteorSesion id in an inner property since _meteorSession will be deleted upon socket closed
        socket.__sid = socket._meteorSession.id;

        var sid = Streamy.id(socket);

        handlers_registered = true;
        
        sessions[sid] = socket;
        Streamy._usersId[sid] = new ReactiveVar();
        
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