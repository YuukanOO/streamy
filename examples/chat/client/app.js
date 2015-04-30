// Since we don't want all those debug messages
Meteor._debug = (function (super_meteor_debug) {
  return function (error, info) {
    if (!(info && _.has(info, 'msg')))
      super_meteor_debug(error, info);
  }
})(Meteor._debug);

var nick = new ReactiveVar();
var room = new ReactiveVar('lobby');

// Subscribe to the clients publication
var client_sub = Meteor.subscribe('clients');

// Subscribe to rooms, done later to ensure Streamy.id is set
var rooms_sub = null;

// Add a local only collection to manage messages
Messages = new Mongo.Collection(null);

// -------------------------------------------------------------------------- //
// -------------------------------- Handlers -------------------------------- //
// -------------------------------------------------------------------------- //

/**
 * Try to retrieve a client by its nickname
 * @param  {String} nick Nickname to look for
 * @return {Client}      Client object or null|undefined if not found
 */
function findClient(nick) {
  return Clients.findOne({ 'nick': nick});
}

/**
 * Generic method to insert a message in the chat panel
 * @param  {String} room Room name concerned
 * @param  {String} body Body message
 * @param  {String} from Session id of the sender
 */
function insertMessage(room, body, from) {
  // Do nothing if not logged in
  if(!nick.get())
    return;

  var c = from ? Clients.findOne({ 'sid': from }): null;
  
  if(from && !c)
    c = { 'nick': from };

  Messages.insert({
    'room': room,
    'body': body,
    'from': c && c.nick
  });

  $('.chat__messages').scrollTo($('li.chat__messages__item:last'));
}

// On disconnect, reset nick name
Streamy.onDisconnect(function() {
  nick.set('');
  Messages.remove({});
});

Streamy.on('nick_ack', function(data) {
  nick.set(data.nick);
});

// On a lobby message, insert the message
Streamy.on('lobby', function(data) {
  insertMessage('lobby', data.body, data.__from);
});

// More generic, when receiving from a room this message, insert it
Streamy.on('text', function(data) {
  insertMessage(data.__in.toLowerCase(), data.body, data.__from);
});

// On private message
Streamy.on('private', function(data) {
  insertMessage(null, data.body, data.__from);
});

// Someone has joined
Streamy.on('__join__', function(data) {
  var c = Clients.findOne({ 'sid': data.sid });
  var msg = ((c && c.nick) || "Someone") + " has joined";

  insertMessage(data.room.toLowerCase(), msg);
});

// Someone has left
Streamy.on('__leave__', function(data) {
  var c = Clients.findOne({ 'sid': data.sid });
  var msg = ((c && c.nick) || 'Someone') + " has left";

  insertMessage(data.room.toLowerCase(), msg);
});

Template.NickChoice.events({
  'submit': function(evt, tpl) {
    if(evt.preventDefault) evt.preventDefault();

    if(rooms_sub !== null)
      rooms_sub.stop();

    rooms_sub = Meteor.subscribe('rooms', Streamy.id);

    var val = tpl.$('#nickname').val();

    if(val)
      Streamy.emit('nick_set', { 'handle': val });
  }
});

function resizeChatZone() {
  $('.chat__messages').css('height', $(window).outerHeight() - ($('.chat__input').outerHeight() * 1.5));
}

Template.App.rendered = function() {
  this.$('.chat__message').focus();
  $(window).resize(resizeChatZone);
  $(window).resize();
};

Template.App.events({
  'click .chat__messages__nick': function(evt) {
    var to = $(evt.target).text();
    $('.chat__message').val('to:' + to + ': ');
    $('.chat__message').focus();
  },
  'submit .chat__input': function(evt, tpl) {
    if(evt.preventDefault) evt.preventDefault();

    var $ele = tpl.$('.chat__message');
    var val = $ele.val();

    if(!val)
      return;

    // Check if its a direct message
    if(val.indexOf('to:') === 0) {
      var end = val.indexOf(':', 3);
      to = findClient(val.substring(3, end));
      val = val.substring(end + 1).trim();
      
      if(!to)
        return;

      Streamy.sessions(to && to.sid).emit('private', {
        body: val
      });

      // And insert the local message
      insertMessage(null, val, 'to: ' + to.nick);
    }
    else {
      var current_room = room.get();

      // Sends the message, using the broadcast or rooms feature
      if(current_room === 'lobby')
        Streamy.broadcast('lobby', { 'body': val });
      else
        Streamy.rooms(current_room).emit('text', { 'body': val });
    }

    $ele.val('');
  },
  'submit .create_or_join': function(evt, tpl) {
    if(evt.preventDefault) evt.preventDefault();

    var $ele = tpl.$('#room__input');
    var val = $ele.val();

    if(!val)
      return;

    // Join the room
    Streamy.join(val.toLowerCase());

    // And switch to it
    room.set(val.toLowerCase());

    $ele.val('');
  },
  'click .rooms__list__joinable': function(evt) {
    room.set(evt.target.innerText.toLowerCase());
  },
  'click .rooms__list__item__leave': function(evt) {
    if(evt.preventDefault) evt.preventDefault();

    var room_name = $(evt.target).prev().text();

    Streamy.leave(room_name);
    Messages.remove({ 'room': room_name }); // Remove messages from this room
    room.set('lobby');

    return false;
  }
});

Template.App.helpers({
  selectedClass: function(room_name) {
    var current_room = room.get();

    return (current_room === room_name.toLowerCase()) && 'rooms__list__item_active';
  },
  messages: function() {
    var current_room = room.get();

    return Messages.find({ 
      $or: [
        { 'room': current_room },
        { 'room': null } // Direct messages
      ]
    });
  },
  rooms: function() {
    return Streamy.rooms();
  }
});

Template.registerHelper('nick', function() {
  return nick.get();
});