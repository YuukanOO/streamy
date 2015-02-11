Streamy.prototype.init = function() {
  
  var self = this;
  
  // Register the __direct__ message handler
  this.on('__direct__', function(data, socket) {
    // Check if the server allows this direct message
    if(!self.__direct__.allow(data, socket) || self.__direct__.deny(data, socket))
      return;
    
    // Attach the sender ID to the inner data
    data.__data.__from = socket.id;
    
    // And then emit the message
    self.emit(data.__msg, data.__data, self.sessions(data.__to));
  });
  
  // On startup, attach to the stream server
  Meteor.startup(function onServerStartup() {
    
    // When a new connection has been received
    Meteor.default_server.stream_server.register(function onNewConnected(socket) {
          
      var handlers_registered = false;
      
      // On closed, call disconnect handlers
      socket.on('close', function onSocketClosed() {
        if(handlers_registered) {
          delete self[socket.id];
          
          _.each(self._disconnect_handlers, function forEachDisconnectHandler(cb) {
            cb.call(self, socket);
          });
        }
      });
      
      // This little trick is used to register protocol handlers on the 
      // socket._meteorSession object, so we need it to be set
      socket.on('data', function onSocketData() {
        
        // Only if the socket as a meteor session
        if(!handlers_registered && socket._meteorSession) {
          
          handlers_registered = true;
          
          self._sessions[socket.id] = socket;
          
          // Call connection handlers
          _.each(self._connect_handlers, function forEachConnectHandler(cb) {
            cb.call(self, socket);
          });
          
          // Add each handler to the list of protocol handlers
          _.each(self._handlers, function forEachHandler(cb, name) {
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
  });
  
};

/**
 * Defines server behaviour for direct messages
 */
Streamy.prototype.__direct__ = {
  allow: function(data, from) {
    return true;
  },
  deny: function(data, from) {
    return false;
  }
};

Streamy.prototype._write = function(data_str, to) {
  if(to)
    to.send(data_str);
};

Streamy.prototype.userId = function(socket) {
  return socket._meteorSession.userId;
};

Streamy.prototype.sessions = function(sess_id) {
  if(sess_id) {
    var sess_found = this._sessions[sess_id];
    if(sess_found)
      return sess_found;
    else // Returns a mock to not failed
      return {
        send: function() {}
      };
  }
  else {
    return _.values(this._sessions);
  }
};