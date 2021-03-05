console.log('hello main')
var bc

console.log('Use [ connect_to_the_network(str: id) ] to connect to the network by any participants id')
console.log('No metter what id you\'ll choose, you will be connected to everybody')
console.log('BlockChain object will be downloaded to the [ bc ] varible')
console.log('Use [ BlockChain.create_new_account() ] to create new wallet and password')
console.log('Fonction returns object {wallet: "", passwrd: ""}')
console.log('Use [ bc.mine(str: wallet, int: break_point) ] to start mining')
console.log('[ break_point ] is wallet balance to stop')
console.log('Use [ bc.get_balance(str: wallet) ] to check wallet balance')
console.log('Remmember that money in pending transaction (not mined yet) is already taken from wallet and not resived by wallet yet')
console.log('Use [ bc.send(obj: account, str: to, int: amount) ] to send money')
console.log('[ account ] is object returned from [ create_new_account() ] func with wallet and password')
console.log('[ to ] is resiver wallet string')



peer.on('connection', function (conn) {
    console.log(`new connection attempt by ${conn.peer}`)
    conn.on('data', data => {
        console.log(`connection openned`)
        if (data == 'n') {
            conn.send(JSON.stringify(bc))
            let peer_id = conn.peer
            for (let id in peer.connections)
                if (id != peer_id)
                    peer.connections[id].forEach(conn => conn.send('c' + peer_id))
        } else handleConnection(data)
        conn.off('data')
        conn.on('data', data => handleConnection(data))
    })
})

function connect_to_the_network(id) {
    var conn = peer.connect(id)
    conn.on('open', () => {
        console.log('connection openned')
        conn.send('n')
    })
    conn.on('data', data => {
        bc = JSON.parse(data)
        bc.__proto__ = BlockChain.prototype
        bc.set_blocks_proto()
        conn.off('data')
        conn.on('data', data => handleConnection(data))
    })
}

async function handleConnection(data) {
    // console.log(data)
    switch (data[0]) {
        case 'a':
            console.log(data.substring(1))
            // alert(data.substring(1))
            break

        case 't':
            transaction = JSON.parse(data.substring(1))
            transaction.__proto__ = Transaction.prototype
            if (transaction.from)
                transaction.signature = base64StringToArrayBuffer(transaction.signature)
            if (await bc.transaction_valid(transaction))
                bc.transactions.push(transaction)
            else console.log('invalid transaction', transaction)
            break

        case 'b':
            block = JSON.parse(data.substring(1))
            block.__proto__ = Block.prototype
            for (let i = 0; i < block.transactions.length; ++i)
                block.transactions[i].__proto__ = Transaction.prototype
            if (await bc.block_valid(block)) {
                bc.chain[block.hash] = block
                if (bc.chain[bc.last].index < block.index) bc.last = block.hash
                bc.transactions = bc.transactions.filter(t => !block.has_transaction(t))
            } else console.log('invalid block', block)
            break

        case 'c':
            connect(data.substring(1))
            break
    }
}

async function create_all(mining_complexity, mining_reward) {
    console.log('Creator')
    var account = await BlockChain.create_account()
    console.log('Wallet', account.wallet)
    console.log('Password', account.password)

    bc = new BlockChain(account.wallet, mining_complexity, mining_reward)
    return account
}

async function test() {
    console.log('\n\n\n')

    console.log('My new Account:')
    var my = await BlockChain.create_account()
    console.log('Wallet', my.wallet)
    console.log('Password', my.password)

    var my_key = await importPrivateKey(my.password)

    bc = new BlockChain(my.wallet, 3, 100)
    console.log(bc.chain[bc.last])
    console.log(bc.transactions)

    console.log('trans[0] valid', await bc.transaction_valid(bc.transactions[0]))

    console.log('my balance: ', bc.get_balance(my.wallet))

    console.log('Friend new Account:')
    var friend = await BlockChain.create_account()
    console.log('wallet', friend.wallet)
    console.log('password', friend.password)

    var friend_key = await importPrivateKey(friend.password)

    console.log('trans 100 to friend')
    await bc.create_transaction(my.wallet, friend.wallet, 100, my_key)

    await bc.mine(my.wallet, 1000)
        .then(() => console.log('my balance: ', bc.get_balance(my.wallet)))
        .then(() => console.log(bc))

    console.log('trans 700 to friend')
    await bc.create_transaction(my.wallet, friend.wallet, 700, my_key)

    console.log('trans 700 to friend')
    await bc.create_transaction(my.wallet, friend.wallet, 700, my_key)

    console.log('my balance', bc.get_balance(my.wallet))

    console.log('trans 300 to me')
    await bc.create_transaction(friend.wallet, my.wallet, 300, my_key)

    console.log('friend balance', bc.get_balance(friend.wallet))

    console.log('mine to deliver money to the friend')
    bc.mine(my.wallet, 400)

    console.log('trans 300 to me')
    await bc.create_transaction(friend.wallet, my.wallet, 300, friend_key)

    console.log(bc)
}

// test()
