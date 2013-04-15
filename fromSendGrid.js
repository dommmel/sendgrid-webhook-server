/* Where I left off...
 Just figured out that bodyParse is parsing the FORM elements, 
 whereas previously I was converting them to an object from the raw 
 form data.
 So I need to probably pass around req instead of my eventData object
 and start using req.body to access the form elements.
*/

/* jslint node: true */
"use strict";

var hipchat = require('node-hipchat'),
    printf = require('util').format,
    util = require('util'),
    Encoder = require('node-html-encoder').Encoder,
    encoder = new Encoder('entity'),
    messageCount = 0,
    linksEvery = 4;

function postMessage(msg, context) {
    var params = {
        room: context.hipchatRoom,
        from: context.hipchatFrom,
        message: msg,
        message_format: 'html',
        notify: 0,
        color: 'yellow'
    }, client = new hipchat(context.hipchatApiKey);
    client.postMessage(params, function (value) { console.log(value); });
}

function formatHipChatMessage(eventData, context) {
    var output = printf('Email from <b>%s</b> to <b>%s</b> was <b>%s</b>',
        context.sendgridEnvironment, eventData.email, eventData.event),
        key = "";
    for (key in eventData) {
        if (eventData.hasOwnProperty(key)) {
            output += printf('<br>%s: %s', key, encoder.htmlEncode(eventData[key]));
        }
    }
    return output;
}

function getLinks(userid) {
    // These links will only work for a user who is 
    // logged into the master account of a SendGrid account.
    // If a user is logged into a sub-account, 
    // the links that would work are different.
    // For example, the link to bounces would be 
    // simply http://sendgrid.com/bounces
    // Furthermore, we're writing the links using the 
    // passed-in user id from the last webhook call.
    // So the links really only work for whatever account 
    // caused that webhook call.
    return printf('<a href="http://sendgrid.com/subuser/emailLogs/id/%s">Email Logs</a>&nbsp;&nbsp;', userid)
        + printf('<a href="http://sendgrid.com/subuser/bounces/id/%s">Bounces</a>&nbsp;&nbsp;', userid)
        + printf('<a href="http://sendgrid.com/subuser/blocks/id/%s">Blocks</a>&nbsp;&nbsp;', userid)
        + printf('<a href="http://sendgrid.com/subuser/spamReports/id/%s">Spam Reports</a>&nbsp;&nbsp;', userid)
        + printf('<a href="http://sendgrid.com/subuser/invalidEmail/id/%s">Invalid Emails</a>&nbsp;&nbsp;', userid)
        + printf('<a href="http://sendgrid.com/subuser/unsubscribes/id/%s">Unsubscribes</a>', userid)
        + '<br /><i>These links only work if you are logged into the master sendgrid account.</i>';
}

/**
 * Call this endpoint from a SendGrid webhook.
 * Expects the following querystring parameters:
 * apikey - HipChat API Key
 * room - HipChat room number (can be fetched from viewing the chat history of any room)
 * user - SendGrid UserId (if using sub-accounts, which we are). This is used to make links back to SendGrid reports.
 * environment - This is an arbitrary string, can contain whatever you want. If you use subusers, you can use this to distinguish which one is calling the webhook.
 */
function postToHipChat(res, req) {
    req.assert('apikey', 'HipChat API key not provided.').notEmpty();
    req.assert('room', 'HipChat room number not provided.').notEmpty();
    req.assert('user', 'SendGrid user not provided.').notEmpty().isInt();
    req.assert('environment', 'SendGrid environment name not provided.').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        res.send('There have been validation errors: ' + util.inspect(errors), 500);
        return;
    }

    // SendGrid can send two kinds of POSTs to the webhook endpoint.
    // It can send a single line of form-encoded data, 
    // or it can do batch mode, sending multiple lines of JSON-formatted data, one complete JSON object per line.
    // In this second batch mode, it's not actually sending a single JSON object, but one JSON object per line.
    // Here we're only handling the first case, a single line of form-encoded data.
    // TODO: Figure out how to deal with multi-line strings in javascript,
    //  detect that the POST came in with content-type application/json,
    //  and deal with multiple JSON objects in batch mode.
    var context = {
        "hipchatApiKey": req.query.apikey,
        "hipchatRoom": req.query.room,
        "hipchatFrom": 'SendGrid',
        "sendgridUserId": req.query.user,
        "sendgridEnvironment": req.query.environment
    },
        eventData = req.body,
        output = "";

    output = formatHipChatMessage(eventData, context);
    res.send(output);
    postMessage(output, context);

    // Every so often, inject links to the SendGrid report pages.
    if (messageCount === 0 || messageCount % linksEvery === 0) {
        postMessage(getLinks(context.sendgridUserId), context);
        messageCount = 0;
    }
    messageCount += 1;
}
exports.postToHipChat = postToHipChat;
