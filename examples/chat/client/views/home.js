var nick = 'not_connected';

function appendChatMessage(from, msg, secret) {
  var ul_container = $('.messages');
  var li_class = "";
  
  if(from === nick)
    li_class = 'self';
  else if(from !== 'server')
    li_class = 'clickable';
    
  if(secret)
    li_class += " secret";
  
  // Append the message
  if(from === 'server')
    $('.messages-list').append($('<li class="notice"><span class="from">notice</span>' + msg + '</li>'));
  else
    $('.messages-list').append($('<li class="' + li_class + '"><span class="from">' + from + ':</span>' + msg + '</li>'));
  
  // And Scroll to top
  ul_container.scrollTop(ul_container[0].scrollHeight);
}

Template.Home.events({
  'click .clickable': function(evt) {
    var to = $(evt.target).text();
    $('.message').val('to:' + to + ' ');
    $('.message').focus();
  }
});

Template.Compose.events({
  'submit': function(evt, tpl) {
    if(evt.preventDefault) evt.preventDefault();
    
    var m_ele = tpl.$('.message');
    var text = m_ele.val();
    
    if(text !== '') {
      
      var to = null;
      
      // Check if its a direct message
      if(text.indexOf('to:') === 0) {
        var end = text.indexOf(':', 3);
        to = text.substring(3, end);
        text = text.substring(end + 1).trim();
        
        Streamy.sessions(to).emit('message', {
          content: text
        });
      }
      else {
        Streamy.emit('message', {
          content: text
        });
      }
      
      // Append self message
      appendChatMessage(nick, text, to);
      
      // Clear the message box
      m_ele.val('');
      
    }
  }
});

// Upon connection enable chat input
Streamy.onConnect(function() {
  $('.message, .send').prop('disabled', '');
});

Streamy.onDisconnect(function() {
  $('.message, .send').prop('disabled', 'disabled');
});

// Register streamy events
Streamy.on('nick', function(data) {
  nick = data.new_nick;
  appendChatMessage('server', 'New nick sets to: ' + nick);
});

Streamy.on('message', function(data) {
  appendChatMessage(data.__from || data.from, data.content, data.__from);
});