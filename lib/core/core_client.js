// -------------------------------------------------------------------------- //
// ------------------------------- Overrides -------------------------------- //
// -------------------------------------------------------------------------- //

Streamy.init = function(options) {
  
  var self = this;

  self._connection = (options && options.connection) ||
      Meteor.default_connection;
  
  // Uppon close
  self._connection._stream.on('disconnect', function onClose() {
    // If it was previously connected, call disconnect handlers
    if(self._connection._stream.status().connected) {
      _.each(self.disconnectHandlers(), function forEachDisconnectHandler(cb) {
        cb.call(self);
      });
    }
  });
  
  // Attach message handlers
  self._connection._stream.on('message', function onMessage(data) {

    // Parse the message
    var parsed_data = JSON.parse(data);
    
    // Retrieve the msg value
    var msg = parsed_data.msg;
    
    // And dismiss it
    delete parsed_data.msg;
    
    // If its the connected message
    if(msg === 'connected') {
      // Call each handlers
      _.each(self.connectHandlers(), function forEachConnectHandler(cb) {
        cb.call(self);
      });
    }
    else if(msg) {
      // Else, call the appropriate handler
      self.handlers(msg).call(self, parsed_data);
    }
  });
  
  
};

Streamy._write = function(data) {
  this._connection._stream.send(data);
};
