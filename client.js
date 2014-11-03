var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();
var id = (''+Date.now()).slice(-4);
var isNew = true;

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket client connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: " + message.utf8Data);
        }
    });

    function sendLocation() {
        if (connection.connected) {
            var obj = {id: id, action: 'location', property: {location: Date.now()%100 } };
            var msg = JSON.stringify(obj);
            connection.sendUTF(msg);
            console.log('sent '+ msg);
        }
    }
    function sendMove() {
        if (connection.connected) {
            var obj = {id: id, action: 'move', property: {location: Date.now()%3 - 1 } };
            var msg = JSON.stringify(obj);
            connection.sendUTF(msg);
            console.log('sent '+ msg);
        }
    }
    var obj = {
        id: id,
        action: 'init',
        property: {
            location: 20
        }
    };
    var msg = JSON.stringify(obj);
    connection.sendUTF(msg);
    console.log('sent '+ msg);
    setInterval(sendMove, 10000) ;
    setInterval(sendLocation, 10000) ;
});

client.connect('ws://localhost:8111/', 'echo-protocol');
//client.connect('ws://ec2-54-197-197-221.compute-1.amazonaws.com:8111/', 'echo-protocol');