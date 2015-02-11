Streamy.prototype.init = function() {
  
  var self = this;
  
  Meteor.startup(function onClientStartup() {
    
    // On close
    Meteor.default_connection._stream.on('disconnect', function onClose() {
      // If it was previously connected, call disconnect handlers
      if(Meteor.default_connection._stream.status().connected) {
        _.each(self._disconnect_handlers, function forEachDisconnectHandler(cb) {
          cb.call(self);
        });
      }
    });
    
    // When a message is received
    Meteor.default_connection._stream.on('message', function onMessage(data) {
      
      // Parse the message
      var parsed_data = JSON.parse(data);
      
      // Retrieve the msg value
      var msg = parsed_data.msg;
      
      // And dismiss it
      delete parsed_data.msg;
      
      // If its the connected message
      if(msg === 'connected') {
        // Call each handlers
        _.each(self._connect_handlers, function forEachConnectHandler(cb) {
          cb.call(self);
        });
      }
      else {
        // Else, call the appropriate handler
        if(self._handlers[msg]) {
          self._handlers[msg].call(self, parsed_data);
        }
      }
    });
    
  });
  
};

Streamy.prototype._write = function(data_str) {
  Meteor.default_connection._stream.send(data_str);
};

Streamy.prototype.userId = function() {
  return Meteor.userId();
};

Streamy.prototype.sessions = function(sid) {
  
  return {
    emit: function(msg, data) {
      Streamy.emit('__direct__', {
        '__to': sid,
        '__msg': msg,
        '__data': data
      });
    }
  };
  
};