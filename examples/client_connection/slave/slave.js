if (Meteor.isClient) {
  var connection = DDP.connect('http://localhost:3000');

  Streamy.setInitOptions({connection: connection});

  Tracker.autorun(function () {
    if (connection.status().connected) {
      Streamy.emit('hello', {message: 'Hello from slave client'});
    }
  });
}

