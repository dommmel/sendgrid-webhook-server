var hipchat = require('node-hipchat');
var client = new hipchat('5fd4363062d8dadf8409ea601ae1b9');

function postMessage(msg) {
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

exports.postMessage = postMessage;