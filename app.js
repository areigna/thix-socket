var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame  = require('websocket').frame;
var WebSocketRouter = require('websocket').router;

var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end('haha');
});
server.listen(8111, function() {
    console.log((new Date()) + ' Server is listening on port 8111');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var connections = {};
var boats = [];

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    //creating new connection
    var connection = request.accept('echo-protocol', request.origin);

    //create an id for connection
    var id = Date.now();
    connection.id = id;
    connections[id+''] = connection;
    console.log('added connection', id);

    //on message
    connection.on('message', function(message) {
        console.log('Received Message: ' + message.utf8Data);

        var obj = JSON.parse(message.utf8Data),
            action = obj.action;

        if(action === 'init'){onInit(obj, connection); }
        else if(action === 'move'){onMove(obj); }
        else if(action === 'location'){onLocation(obj); }
        else if(action === 'leave'){onLocation(obj); }

    });

    //on close
    connection.on('close', function(reasonCode, description) {
        deleteConnection(connection.id);
        deleteBoat(connection.boatId);
    });
});


/*
new boat init
- R(array[init])
- B(init)
- save array
*/
function onInit(obj, connection){
    send(JSON.stringify(boats), connection.id);
    send(JSON.stringify(obj));
    //associate boat id with connection
    connection.boatId = obj.id;

    boats.push(obj);
    console.log('added boat to array');
    console.log(boats);
}
/*
move the boat
- B(move)
*/
function onMove(obj){
    send(obj);
}
/*
change the location
- add to array
*/
function onLocation(obj){
    for(var i = 0 ;i < boats.length; i++){
        if(boats[i].id === obj.id){
            boats[i].property.location = obj.property.location;
            console.log('boats:')
            console.log(boats);
            return;
        }
    }
}
/*
leave the scene
- B(leave)
- remove from array
*/
function onLeave(obj){
    send(obj);
    deleteBoat(obj.id);
}

//broadcast to all connections or send to one person
function send(content, id){
    var msg = typeof content === 'object' ? JSON.stringify(content) : content ;
    if(id){
        connections[id].sendUTF(msg);
    }
    else{
        for(x in connections){
            connections[x].sendUTF(msg);
        }
    }
}

//delete the connection
function deleteConnection(id){
    delete connections[id];
    console.log('deleted connection', id);
}

//delete the boat from boat array
function deleteBoat(id){
    for(var i = 0;i< boats.length;i ++){
        if(boats[i].id === id){
            boats.splice(i, 1);
        }
    } 
    console.log('boats:');
    console.log(boats);
}