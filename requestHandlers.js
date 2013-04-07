var url = require('url');
var hipchat = require('node-hipchat');
var querystring = require('querystring');

function _postMessage(msg, apikey) {
    var params = {
        room: '171098',
        from: 'NodeLarry ',
        message: msg,
        message_format: 'html',
        notify: 0,
        color: 'yellow'
    };
    var client = new hipchat(apikey);
    client.postMessage(params, function (value) { console.log(value); })
}

function postSendGridMessage(response, request) {
    // For POST collection info, see: http://stackoverflow.com/questions/4295782/how-do-you-extract-post-data-in-node-js
    var queryData = "";

    // Validate that a HipChat API key was provided.
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;
    if (typeof query.apikey === 'undefined' || !query.apikey)
    {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write("Invalid HipChat API key.");
        response.end();
        return;
    }

    if (request.method == 'POST') {
        response.writeHead(200, { "Content-Type": "text/html" });
        request.on('data', function (data) {
            queryData += data;
            if (queryData.length > 1e6) {
                queryData = "";
                response.writeHead(413, { 'Content-Type': 'text/plain' });
                request.connection.destroy();
            }
        });

        request.on('end', function () {
            response.writeHead(200, { "Content-Type": "text/html" });
            _postMessage(JSON.stringify(querystring.parse(queryData)), query.apikey);
            response.end();
        });
    }
    else {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end();
    }
}

exports.postSendGridMessage = postSendGridMessage;