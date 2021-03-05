console.log('hello crypto')

function generateKey(alg, scope) {
    return new Promise(resolve =>
        crypto.subtle.generateKey(alg, true, scope).then(pair => resolve(pair)))
}

function arrayBufferToBase64String(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer)
    var byteString = ''
    for (var i = 0; i < byteArray.byteLength; ++i)
        byteString += String.fromCharCode(byteArray[i])
    return btoa(byteString)
}

function base64StringToArrayBuffer(b64str) {
    var byteStr = atob(b64str)
    var bytes = new Uint8Array(byteStr.length)
    for (var i = 0; i < byteStr.length; ++i)
        bytes[i] = byteStr.charCodeAt(i)
    return bytes.buffer
}

function textToArrayBuffer(str) {
    var buf = unescape(encodeURIComponent(str))
    var bufView = new Uint8Array(buf.length)
    for (var i = 0; i < buf.length; ++i)
        bufView[i] = buf.charCodeAt(i)
    return bufView
}

function arrayBufferToText(arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer)
    var str = ''
    for (var i = 0; i < byteArray.byteLength; ++i)
        str += String.fromCharCode(byteArray[i])
    return str
}

function arrayBufferToBase64(arr) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(arr)))
}

function importPublicKey(pemKey) {
    return new Promise(resolve =>
        crypto.subtle.importKey(
            "spki", base64StringToArrayBuffer(pemKey), signAlgorithm, true, ["verify"]
        ).then(key => resolve(key))
    )
}

function importPrivateKey(pemKey) {
    return new Promise(resolve =>
        crypto.subtle.importKey(
            "pkcs8", base64StringToArrayBuffer(pemKey), signAlgorithm, true, ["sign"]
        ).then(key => resolve(key))
    )
}

function exportPublicKey(keys) {
    return new Promise(resolve =>
        window.crypto.subtle.exportKey('spki', keys.publicKey)
            .then(spki => resolve(arrayBufferToBase64String(spki))))
}

function exportPrivateKey(keys) {
    return new Promise(resolve =>
        window.crypto.subtle.exportKey('pkcs8', keys.privateKey)
            .then(pkcs8 => resolve(arrayBufferToBase64String(pkcs8)))
    )
}

function exportPemKeys(keys) {
    return new Promise(resolve =>
        exportPublicKey(keys).then(pubKey =>
            exportPrivateKey(keys).then(privKey =>
                resolve({ publicKey: pubKey, privateKey: privKey }))))
}

function signData(key, data) {
    return window.crypto.subtle.sign(signAlgorithm, key, textToArrayBuffer(data))
}

function verifySig(pub, sig, data) {
    return crypto.subtle.verify(signAlgorithm, pub, sig, data)
}

var signAlgorithm = {
    name: "RSASSA-PKCS1-v1_5",
    hash: {
        name: "SHA-256"
    },
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1])
}

var crypto = window.crypto || window.msCrypto
var scopeSign = ['sign', 'verify']
