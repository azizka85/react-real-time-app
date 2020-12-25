const websocket = require('websocket')
const http = require('http')
const uuid = require('uuid')

const port = 3001

const server = http.createServer()
server.listen(port)

const wss = new websocket.server({
    httpServer: server,
    autoAcceptConnections: false
})

const connections = {}

wss.on('request', function(request) {
    if(!originIsAllowed(request.origin)) {
        request.reject()
        return
    }
    const connection = request.accept(null, request.origin)
    connection.id = uuid.v4()
    connections[connection.id] = connection
    
    broadcast(connection.id, `Client ${connection.id} connected, connected clients: ${Object.keys(connections).length}`)

    connection.on('message', message => broadcast(connection.id, message.utf8Data))
    connection.on('close', (reasonCode, description) => {        
        delete connections[connection.id]
        broadcast(connection.id, `Client ${connection.id} closed, connected clients: ${Object.keys(connections).length}`)
    })
})

function originIsAllowed(origin) {
    return true
}

function broadcast(clientId, message) {
    for([connectionID, connection] of Object.entries(connections)) {
        if(connection.readyState == websocket.OPEN)
            connection.send(`[${clientId}]: ${message}`)
    }
}