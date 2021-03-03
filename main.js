var peer = new Peer()
var my_id

console.log('This is P2P browser console app')
console.log('After initialization you\'ll see your id')
console.log('Use [ connect(str:id) ] function to connect to other clients using their id')
console.log('To send messages use [ conn.send(str) ], where conn is connection obj, can be found in [ peer.connections ]')


peer.on('open', function (id) {
    my_id = id
    console.log('My id: ', my_id)
})

peer.on('connection', function (conn) {
    console.log(`new connection attempt by ${conn.peer}`)
    conn.on('data', function (data) {
        console.log(data)
        conn.send('connected ' + my_id)
        conn.off('data')
        conn.on('data', data => console.log(data))
    })
})

function connect(id) {
    var conn = peer.connect(id)
    conn.on('open', function () {
        console.log(`connection attempt with ${id}`)
        conn.send('connected ' + my_id)
    })
    conn.on('data', data => console.log(data))
}
