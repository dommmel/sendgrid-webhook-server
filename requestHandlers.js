var url = require('url');
var hipchat = require('node-hipchat');
var querystring = require('querystring');

var messageCount = 0;
var linksEvery = 4;

function _postMessage(msg, apikey, roomNumber, fromName) {
    var params = {
        room: roomNumber,
        from: fromName,
        message: msg,
        message_format: 'html',
        notify: 0,
        color: 'yellow'
    };
    var client = new hipchat(apikey);
    client.postMessage(params, function (value) { console.log(value); })
}

function _formatHipChatMessage(evt, userid)
{
    var output = 'Email to <strong>' + evt.email + '</strong> was <strong>' + evt.event + '</strong>';

    if (evt.status)
        output += '<br>Bounce Status: ' + evt.status;

    if (evt.type)
        output += '<br>Bounce Type: ' + evt.type;

    if (evt.reason)
        output += '<br>Reason: ' + evt.reason;

    if (evt.response)
        output += '<br>Response: ' + evt.response;

    if (evt.url)
        output += '<br>URL: ' + evt.url;

    if (evt.category)
        output += '<br>Category: ' + evt.category;

    if (evt.attempt)
        output += '<br>Attempt: ' + evt.attempt;

    if (evt["smtp-id"])
        output += '<br>smtp-id: ' + evt["smtp-id"];

    return output;
}

function _getLinks(userid)
{
    return '<a href="http://sendgrid.com/subuser/bounces/id/137257">Bounces</a>&nbsp;&nbsp;'
     + '<a href="http://sendgrid.com/subuser/blocks/id/137257">Blocks</a>&nbsp;&nbsp;'
     + '<a href="http://sendgrid.com/subuser/spamReports/id/137257">Spam Reports</a>&nbsp;&nbsp;'
     + '<a href="http://sendgrid.com/subuser/invalidEmail/id/137257">Invalid Emails</a>&nbsp;&nbsp;'
     + '<a href="http://sendgrid.com/subuser/unsubscribes/id/137257">Unsubscribes</a>'
}

function postSendGridMessage(response, request) {
    var queryData = "";    
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;

    // Validate that a HipChat API key was provided.
    if (typeof query.apikey === 'undefined' || !query.apikey)
    {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write("Invalid HipChat API key.");
        response.end();
        return;
    }

    // Validate that a HipChat room number was provided.
    if (typeof query.room === 'undefined' || !query.room)
    {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write("Room number not specified.");
        response.end();
        return;
    }

    // Validate that a Sendgrid user id was provided.
    if (typeof query.user === 'undefined' || !query.user)
    {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.write("SendGrid User ID not specified.");
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
            var evt = JSON.parse(queryData);
            var output = _formatHipChatMessage(evt, query.user);

            _postMessage(output, query.apikey, query.room, 'SendGrid');

            if (messageCount === 0)
            {
                _postMessage(_getLinks(query.user), query.apikey, query.room, 'SendGrid');
            }

            if (messageCount === (linksEvery - 1))
                messageCount = 0;
            else
                messageCount++;

            response.end();

        });
    }
    else {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end();
    }

}

exports.postSendGridMessage = postSendGridMessage;