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

function _formatHipChatMessage(eventData, environment) {
    // To just dump what was posted, converted to JSON format, return util.inspect(eventData);
    var output = printf('Email from <b>%s</b> to <b>%s</b> was <b>%s</b>', environment, eventData.email, eventData.event);

    if (eventData.status)
        output += printf('<br>Bounce Status: %s', eventData.status);

    if (eventData.type)
        output += printf('<br>Bounce Type: %s', eventData.type);

    if (eventData.reason)
        output += printf('<br>Reason: %s', eventData.reason);

    if (eventData.response)
        output += printf('<br>Response: %s', eventData.response);

    if (eventData.url)
        output += printf('<br>URL: %s', eventData.url);

    if (eventData.category)
        output += printf('<br>Category: %s', eventData.category);

    if (eventData.attempt)
        output += printf('<br>Attempt: %s', eventData.attempt);

    // This smtp-id needs to be handled differently because of the dash.
    // Can't access it like a regular object property because javascript interprets the dash as a minus sign.
    // Additionally, this field has been proven to often include encoded < and > signs
    if ("smtp-id" in eventData && eventData["smtp-id"].length > 0)
        output += printf('<br>smtp-id: %s', decodeURIComponent(eventData["smtp-id"]));

    return output;
}

function _getLinks(userid) {
    // These links will only work for a user who is logged into the master account of a SendGrid account.
    // If a user is logged into a sub-account, the links that would work are different.
    // For example, the link to bounces would be simply http://sendgrid.com/bounces
    // Furthermore, we're writing the links using the passed-in user id from the last webhook call.
    // So the links really only work for whatever account caused that webhook call.
    return printf('<a href="http://sendgrid.com/subuser/emailLogs/id/%s">Email Logs</a>&nbsp;&nbsp;', userid)
     + printf('<a href="http://sendgrid.com/subuser/bounces/id/%s">Bounces</a>&nbsp;&nbsp;', userid)
     + printf('<a href="http://sendgrid.com/subuser/blocks/id/%s">Blocks</a>&nbsp;&nbsp;', userid)
     + printf('<a href="http://sendgrid.com/subuser/spamReports/id/%s">Spam Reports</a>&nbsp;&nbsp;', userid)
     + printf('<a href="http://sendgrid.com/subuser/invalidEmail/id/%s">Invalid Emails</a>&nbsp;&nbsp;', userid)
     + printf('<a href="http://sendgrid.com/subuser/unsubscribes/id/%s">Unsubscribes</a>', userid)
     + ' <i>These links only work if you are logged into the master sendgrid account.</i>'
}

function _isInputValid(input, errorMessage, response) {
    if (typeof input === 'undefined' || !input) {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end(errorMessage);
        return false;
    }
    return true;
}

/**
 * Call this endpoint from a SendGrid webhook.
 * Expects the following querystring parameters:
 * apikey - HipChat API Key
 * room - HipChat room number (can be fetched from viewing the chat history of any room)
 * user - SendGrid UserId (if using sub-accounts, which we are). This is used to make links back to SendGrid reports.
 * environment - This is an arbitrary string, can contain whatever you want. If you use subusers, you can use this to distinguish which one is calling the webhook.
 */
function postSendGridMessage(response, request) {
    var rawPostData = "";
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

    // Ignore everything but POST.
    if (request.method != 'POST') {
        response.writeHead(405, { 'Content-Type': 'text/plain' });
        response.end();
    }

    request.on('data', function (data) {
        rawPostData += data;
        if (rawPostData.length > 1e6) {
            rawPostData = "";
            response.writeHead(413, { 'Content-Type': 'text/plain' });
            request.connection.destroy();
        }
    });

    request.on('end', function () {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end();

        console.log('POST: ' + rawPostData);

        // SendGrid can send two kinds of POSTs to the webhook endpoint.
        // It can send a single line of form-encoded data, 
        // or it can do batch mode, sending multiple lines of JSON-formatted data, one complete JSON object per line.
        // In this second batch mode, it's not actually sending a single JSON object, but one JSON object per line.
        // Here we're only handling the first case, a single line of form-encoded data.
        // TODO: Figure out how to deal with multi-line strings in javascript,
        //  detect that the POST came in with content-type application/json,
        //  and deal with multiple JSON objects in batch mode.

        // Convert the POST name/value pairs into a javascript object.
        var eventData = querystring.parse(rawPostData);
        var output = _formatHipChatMessage(eventData, query.environment);
        _postMessage(output, query.apikey, query.room, 'SendGrid');

        // Every so often, inject links to the SendGrid report pages.
        if (messageCount === 0)
            _postMessage(_getLinks(query.user), query.apikey, query.room, 'SendGrid');
        if (messageCount++ === linksEvery)
            messageCount = 0;
    });
}
/**
 * A url to query to let us know the service is still running.
 * Simply returns 0.
 */
function heartbeat(response, request) {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end('0');
}

exports.postSendGridMessage = postSendGridMessage;
exports.heartbeat = heartbeat;