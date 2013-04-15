/* jslint node: true */
"use strict";

var fromSendGrid = require('./fromSendGrid'),
    util = require('util'),
    express = require('express'),
    expressValidator = require('express-validator'),
    app = express();

app.use(express.bodyParser());
app.use(expressValidator);

/**
 * Heartbeat lets us know the service is still running. Simply returns 0.
 */
app.get('/heartbeat', function (req, res) {
    res.send('0');
});

app.post('/postSendGridMessage', function (req, res) {
    fromSendGrid.postToHipChat(res, req);
});

var port = process.env.PORT || 8888;
app.listen(port);
console.log("Server has started, listening on port " + port);

