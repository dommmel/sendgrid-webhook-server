var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {}
handle["/postSendGridMessage"] = requestHandlers.postSendGridMessage;
handle["/heartbeat"] = requestHandlers.heartbeat;

server.start(router.route, handle);