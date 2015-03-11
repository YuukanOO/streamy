Streamy.prototype.init = function() {
  
  var self = this;
  
  // Register the __room__ handler
  this.on('__room__', function(data, socket) {
    var msg = data.__msg;
    var room = data.__room;
    
    if(data.__data)
      data.__data.__from = socket.id;
    
    // If room is not defined, do nothing
    if(!room)
      return;
    
    if(msg === 'join') {
      // Check server validation
      if(self.Rooms.join(data, socket))
        self.join(room, socket);
    }
    else if(msg === 'leave') {
      // Check server validation
      if(self.Rooms.leave(data, socket))
        self.leave(room, socket);
    }
    else if(msg) {
      // Check if the user is in the room
      if(self.Rooms.message(room, msg, data.__data, socket))
        self.rooms(room).emit(msg, data.__data, socket);
    }
  });
  
  // Register the __direct__ message handler
  this.on('__direct__', function(data, socket) {
    // Check if the server allows this direct message
    if(!self.DirectMessages.allow(data, socket) || self.DirectMessages.deny(data, socket))
      return;
    
    // Attach the sender ID to the inner data
    data.__data.__from = socket.id;
    
    // And then emit the message
    self.emit(data.__msg, data.__data, self.sessions(data.__to));
  });
  
  this.on('__broadcast__', function(data, socket) {
    // Check if the server allows this broadcast message
    if(!self.BroadCasts.allow(data, socket) || self.BroadCasts.deny(data, socket))
      return;
      
    // Attach the sender ID to the inner data
    data.__data.__from = socket.id;
    
    // And then emit the message
    self.broadcast(data.__msg, data.__data, socket);
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
Streamy.prototype.DirectMessages = {
  allow: function(data, from) {
    return true;
  },
  deny: function(data, from) {
    return false;
  }
};

/**
 * Defines server behaviour for broadcast messages
 */
Streamy.prototype.BroadCasts = {
  allow: function(data, from) {
    return true;
  },
  deny: function(data, from) {
    return false;
  }
};

Streamy.prototype.broadcast = function(msg, data, sender) {
  var sockets = this.sessions();
  var self = this;
  
  _.each(sockets, function(s) {
    if(sender && s.id === sender.id)
      return;
    
    self.emit(msg, data, s);
  });
};

/**
 * Defines server behaviour for rooms
 */
Streamy.prototype.Rooms = {
  join: function(data, from) {
    return true;
  },
  onJoined: function(room, socket) {
    
  },
  leave: function(data, from) {
    return true;
  },
  onLeft: function(room, socket) {
    
  },
  message: function(room, msg, data, from) {
    return Streamy.isInRoom(room, from.id);
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

Streamy.prototype.rooms = function(room_name) {
  var self = this;
  
  return {
    emit: function(msg, data) {
      var room = Rooms.findOne({ 'name': room_name })
      
      if(!room)
        return;
      
      _.each(room.sessions, function(sid) {
        var to = self.sessions(sid);
        Streamy.emit(msg, data, to);
      });
    }
  };
};

Streamy.prototype.join = function(room_name, socket) {
  var room = Rooms.findOne({ 'name': room_name });
  var room_id;
  
  // Creates the room if needed
  if(!room) {
    room_id = Rooms.insert({
      'name': room_name,
      'sessions': []
    });
  }
  else {
    room_id = room._id;
  }
  
  // Inform other users of the join
  this.Rooms.onJoined(room, socket);
  
  Rooms.update(room_id, {
    $addToSet: {
      'sessions': socket.id
    }
  });
};

Streamy.prototype.leave = function(room_name, socket) {
  var room = Rooms.findOne({ 'name': room_name, 'sessions': socket.id });
  
  // Returns if the room was not found
  if(!room)
    return;
  
  Rooms.update(room._id, {
    $pull: {
      'sessions': socket._id
    }
  });
    
  this.Rooms.onLeft(room, socket);
};

Meteor.publish('streamy:rooms', function() {
  return Rooms.find();
});