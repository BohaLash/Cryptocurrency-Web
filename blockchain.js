class Transaction {
    constructor(from = '', to = '', amount = 0) {
        this.from = from
        this.to = to
        this.amount = amount
        this.time = Date.now()
        this.signature = {}
    }

    async sign(privateKey) {
        this.signature = await signData(privateKey, JSON.stringify(this))
    }

    local_valid() {
        if (this.time > Date.now()) return false
        if (this.from == this.to || !this.to) return false
        return true
    }
}


class Block {
    constructor(index = 0, prev_hash = '', transactions = [], proof = 0) {
        this.index = index
        this.prev_hash = prev_hash
        this.transactions = transactions
        this.proof = proof
    }

    get hash() {
        return CryptoJS.SHA256(JSON.stringify(this)).toString()
    }

    mine(complexity) {
        console.log('mining...', complexity)
        while (!this.proof_valid(complexity)) this.proof++;
    }

    has_transaction(transaction) {
        if (!transaction.from) transaction.from = undefined
        for (let t of this.transactions) {
            if (t.signature == transaction.signature &&
                t.to == transaction.to &&
                t.form == transaction.from &&
                t.amount == transaction.amount)
                return true
        }
        return false
    }

    proof_valid(complexity) {
        // console.log(
        //     this.hash.substring(0, complexity), 
        //     '0'.repeat(complexity), 
        //     this.hash.substring(0, complexity) == '0'.repeat(complexity))
        return (this.hash.substring(0, complexity) == '0'.repeat(complexity))
    }
}


class BlockChain {
    constructor(creator = '', complexity = 0, reward = 1) {
        this.complexity = complexity
        this.reward = reward
        this.chain = {}
        this.transactions = []
        this._create_genesis(creator)
    }

    _create_genesis(creator) {
        let block = new Block()
        block.mine(this.complexity)
        this.last = block.hash
        this.chain[this.last] = block
        let transaction = new Transaction('', creator, this.reward)
        transaction.signature = block.proof.toString()
        this.transactions.push(transaction)
    }

    set_blocks_proto() {
        for (let i = 0; i < this.transactions.length; ++i)
            this.transactions[i].__proto__ = Transaction.prototype
        for (let b in this.chain) {
            this.chain[b].__proto__ = Block.prototype
            for (let i = 0; i < this.chain[b].transactions.length; ++i)
                this.chain[b].transactions[i].__proto__ = Transaction.prototype
        }
    }

    async create_block(miner) {
        let block = new Block(this.chain[this.last].index + 1, this.last, this.transactions)
        block.mine(this.complexity)
        this.new_block(block)
        // this.transactions = []
        let transaction = new Transaction('', miner, this.reward)
        transaction.signature = block.proof.toString()
        this.new_transaction(transaction)
    }

    new_block(block) {
        this.last = block.hash
        this.chain[this.last] = block

        this.transactions = this.transactions.filter(t => !block.transactions.includes(t))

        send_all('b' + JSON.stringify(block))
    }

    async create_transaction(from, to, amount, privateKey) {
        let transaction = new Transaction(from, to, amount)
        await transaction.sign(privateKey)
        if (await this.transaction_valid(transaction))
            this.new_transaction(transaction)
        else
            console.error('invalid transaction')
    }

    new_transaction(transaction) {
        this.transactions.push(transaction)
        if (transaction.from)
            transaction.signature = arrayBufferToBase64(transaction.signature)
        send_all('t' + JSON.stringify(transaction))
    }

    async block_valid(block) {
        if (!block.proof_valid(this.complexity)) return false
        if (block.index > 0 &&
            this.chain[block.prev_hash].index != block.index - 1) return false
        for (let t of block.transactions)
            if (!(await this.transaction_valid(t))) return false
        return true
    }

    async transaction_valid(transaction) {
        if (!transaction.local_valid()) return false
        if (transaction.from) {
            if (!(await verifySig(
                await importPublicKey(transaction.from),
                transaction.signature,
                textToArrayBuffer(JSON.stringify(transaction))
            ))) return false
            let a = 0
            this.transactions.forEach(t => {
                if (t.time < transaction.time)
                    if (t.from == transaction.from) a -= t.amount
            })
            for (let b = this.last; b; b = this.chain[b].prev_hash) {
                this.chain[b].transactions.forEach(t => {
                    if (t.time < transaction.time) {
                        if (t.from == transaction.from) a -= t.amount
                        else if (t.to == transaction.from) a += t.amount
                    }
                })
                if (a >= transaction.amount) return true
            }
        } else
            for (let b = this.last; b; b = this.chain[b].prev_hash) {
                if (this.chain[b].proof == transaction.signature)
                    return true
                for (let t of this.chain[b].transactions)
                    if (t.time <= transaction.time && !t.from && t.signature == transaction.signature)
                        return false
            }
        return false
    }

    get_balance(wallet) {
        let a = 0
        this.transactions.forEach(t => {
            if (t.from == wallet) a -= t.amount
        })
        for (let b = this.last; this.chain[b].index > 0; b = this.chain[b].prev_hash)
            this.chain[b].transactions.forEach(t => {
                if (t.from == wallet) a -= t.amount
                else if (t.to == wallet) a += t.amount
            })
        return a
    }

    async mine(wallet, brear_point = 0) {
        while (!brear_point || this.get_balance(wallet) < brear_point)
            await this.create_block(wallet)

        // var mining = setInterval(function (balance, create) {
        //     if (brear_point && balance(wallet) >= brear_point) clearInterval(mining)
        //     await create(wallet)
        // }, delay, this.get_balance, this.create_block)
    }

    async send(account, resiver_wallet, amount) {
        this.create_transaction(
            account.wallet, resiver_wallet, amount,
            await importPrivateKey(account.password))
    }

    static async create_account() {
        let pair = await generateKey(signAlgorithm, scopeSign)
        let keys = await exportPemKeys(pair)
        return { wallet: keys.publicKey, password: keys.privateKey }
    }
}
