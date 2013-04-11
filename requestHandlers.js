var url = require('url');
var hipchat = require('node-hipchat');
var querystring = require('querystring');
var printf = require('util').format;
var util = require('util');
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

function _formatHipChatMessage(evt, environment)
{
    return util.inspect(evt);
    /*
    var output = printf('Email from <b>%s</b> to <b>%s</b> was <b>%s</b>', environment, evt.email, evt.event);

    if (evt.status)
        output += printf('<br>Bounce Status: %s', evt.status);

    if (evt.type)
        output += printf('<br>Bounce Type: %s', evt.type);

    if (evt.reason)
        output += printf('<br>Reason: %s', evt.reason);

    if (evt.response)
        output += printf('<br>Response: %s', evt.response);

    if (evt.url)
        output += printf('<br>URL: %s', evt.url);

    if (evt.category)
        output += printf('<br>Category: %s', evt.category);

    if (evt.attempt)
        output += printf('<br>Attempt: %s', evt.attempt);

    if (evt["smtp-id"])
        output += printf('<br>smtp-id: %s', evt["smtp-id"]);

    return output;
    */
}

function _getLinks(userid)
{
    return printf('<a href="http://sendgrid.com/subuser/emailLogs/id/%s">Email Logs</a>&nbsp;&nbsp;',userid)
     + printf('<a href="http://sendgrid.com/subuser/bounces/id/%s">Bounces</a>&nbsp;&nbsp;',userid)
     + printf('<a href="http://sendgrid.com/subuser/blocks/id/%s">Blocks</a>&nbsp;&nbsp;',userid)
     + printf('<a href="http://sendgrid.com/subuser/spamReports/id/%s">Spam Reports</a>&nbsp;&nbsp;',userid)
     + printf('<a href="http://sendgrid.com/subuser/invalidEmail/id/%s">Invalid Emails</a>&nbsp;&nbsp;',userid)
     + printf('<a href="http://sendgrid.com/subuser/unsubscribes/id/%s">Unsubscribes</a>',userid)
}

function _isInputValid(input, errorMessage, response) {
    if (typeof input === 'undefined' || !input)
    {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end(errorMessage);
        return false;
    }
    return true;
}

function postSendGridMessage(response, request) {
    var queryData = "";    
    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;

    // Validate that a HipChat API key was provided.
    if (!_isInputValid(query.apikey, "HipChat API key not provided.", response))
        return;
    if (!_isInputValid(query.room, "HipChat room number not provided.", response))
        return;
    if (!_isInputValid(query.user, "SendGrid user not provided.", response))
        return;
    if (!_isInputValid(query.environment, "SendGrid environment name not provided.", response))
        return;
    
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
            var output = _formatHipChatMessage(evt, query.environment);

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

function heartbeat(response, request) {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end('0');
}

exports.postSendGridMessage = postSendGridMessage;
exports.heartbeat = heartbeat;