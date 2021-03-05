console.log('p2p hello')
var peer = new Peer()

var my_id

peer.on('open', function (id) {
    my_id = id
    console.log('My id: ', my_id)
})

function connect(id) {
    var conn = peer.connect(id)
    console.log(`connection attempt with ${id}`)
    conn.on('open', () => conn.send('aconnected ' + my_id))
    conn.on('data', data => handleConnection(data))
}

function send_all(str) {
    // console.log('send', str)
    // console.log(Object.values(peer.connections))
    Object.values(peer.connections).forEach(conns => conns[conns.length - 1].send(str))
}