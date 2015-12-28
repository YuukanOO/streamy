Streamy.on('hello', function(data, socket) {
  console.log('Master server received:', data.message);
});

