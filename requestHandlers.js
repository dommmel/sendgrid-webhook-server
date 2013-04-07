var url = require('url');
var hipchat = require('node-hipchat');
var querystring = require('querystring');
var client = new hipchat('5fd4363062d8dadf8409ea601ae1b9');


function _postMessage(msg) {
  var params = {
    room: '171098',
    from: 'NodeLarry ',
      message: msg,
      message_format: 'html',
      notify: 0,
      color: 'yellow'
  };
  client.postMessage(params, function(value) { console.log(value); })
}

function postSendGridMessage(response, request) {
  // For POST collection info, see: http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js
  var queryData = "";
  
  if (request.method == 'POST') {
    response.writeHead(200, { "Content-Type": "text/html" });
    request.on('data', function (data) {
      queryData += data;
      if(queryData.length > 1e6) {
        queryData = "";
        response.writeHead(413, {'Content-Type': 'text/plain'});
        request.connection.destroy();
      }
    });

    request.on('end', function() {
       response.writeHead(200, {"Content-Type": "text/html"});
       _postMessage(JSON.stringify(querystring.parse(queryData)));
       response.end();
    });
  } 
  else {
    response.writeHead(405, {'Content-Type': 'text/plain'});
    response.end();
  }
}

exports.postSendGridMessage = postSendGridMessage;