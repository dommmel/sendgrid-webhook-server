var url = require('url');
var hipchat = require('node-hipchat');
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
  console.log("Request handler 'hookSendGrid' was called.");
  var queryObject = url.parse(request.url,true).query;
  if (queryObject.message != null) {
    console.log (queryObject.message);
    _postMessage(queryObject.message);
  }
  
  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    'Received call to hookSendGrid.'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

exports.postSendGridMessage = postSendGridMessage;