"use strict";
// testCoin.ts
Object.defineProperty(exports, "__esModule", { value: true });
// 1. Importações (Certifique-se de ter instalado com npm install)
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var CryptoJS = require("crypto-js"); // <-- CORRIGIDO AQUI
// 2. Classe Block (previousHash permite null)
var Block = /** @class */ (function () {
    function Block(index, hash, previousHash, timestamp, data) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
    return Block;
}());
// 3. calculateHash (com return)
var calculateHash = function (index, previousHash, timestamp, data) {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString(); // <-- CORRIGIDO AQUI
};
// 4. Bloco Gênesis (agora compatível com Block class)
var genesisBlock = new Block(0, '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null, // <-- null agora é permitido pelo tipo
1465154705, 'my genesis block!!');
// 5. Variável da Blockchain (usando 'let' e minúscula)
var blockchain = [genesisBlock]; // <-- CORRIGIDO AQUI
// 6. Funções Auxiliares (getLatestBlock, getBlockchain, calculateHashForBlock)
var getLatestBlock = function () { return blockchain[blockchain.length - 1]; }; // <-- CORRIGIDO AQUI
var getBlockchain = function () { return blockchain; }; // <-- ADICIONADO AQUI
var calculateHashForBlock = function (block) {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};
// 7. generateNextBlock (adicionando ao blockchain e tipo de retorno)
var generateNextBlock = function (blockData) {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    var newBlock = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    blockchain.push(newBlock); // <-- ADICIONADO AQUI: Adiciona o novo bloco à cadeia
    return newBlock;
};
// 8. isValidNewBlock (tipos de retorno e sem comentários de debug)
var isValidNewBlock = function (newBlock, previousBlock) {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    }
    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};
// 9. isValidBlockStructure (tipo de retorno)
var isValidBlockStructure = function (block) {
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string' // Nota: 'string | null' seria mais preciso, mas 'string' funciona para a maioria dos casos se null for tratado como uma string vazia ou validado separadamente. Para a estrutura, 'string' está OK se o Gênesis for o único com null.
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};
// 10. isValidChain
var isValidChain = function (blockchainToValidate) {
    var isValidGenesis = function (block) {
        // Isso é um problema! JSON.stringify pode ter ordens de propriedades diferentes
        // O ideal é comparar as propriedades uma a uma ou re-calcular o hash do Gênesis e comparar.
        // Por simplicidade, para agora, vamos manter, mas saiba que não é o ideal.
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if (!isValidGenesis(blockchainToValidate[0])) {
        console.log('invalid genesis block');
        return false;
    }
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};
// 11. replaceChain
var replaceChain = function (newBlocks) {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest(); // Função P2P placeholder
    }
    else {
        console.log('Received blockchain invalid');
    }
};
// 12. Placeholder para P2P (MUITO IMPORTANTE!)
var sockets = []; // Onde você gerenciaria as conexões WebSocket
var getSockets = function () { return sockets; };
var connectToPeers = function (newPeer) {
    console.log("[P2P] Tentando conectar a: ".concat(newPeer));
    // A implementação real envolveria 'ws' ou similar
    // Ex: const ws = new WebSocket(newPeer);
    // ws.on('open', () => { /* adicionar ws aos sockets */ });
    // ws.on('message', (data) => { /* processar mensagem */ });
    // ws.on('close', () => { /* remover ws dos sockets */ });
    // ws.on('error', () => { /* lidar com erro */ });
};
var broadcastLatest = function () {
    console.log('[P2P] Transmitindo o bloco mais recente...');
    // Iterar sobre 'sockets' e enviar getLatestBlock() para cada um
};
// 13. initHttpServer
var initHttpServer = function (myHttpPort) {
    var app = (0, express_1.default)();
    app.use(body_parser_1.default.json());
    app.get('/blocks', function (req, res) {
        res.send(getBlockchain());
    });
    app.post('/mineBlock', function (req, res) {
        var newBlock = generateNextBlock(req.body.data);
        res.send(newBlock);
    });
    app.get('/peers', function (req, res) {
        res.send(getSockets().map(function (s) { return (s._socket ? s._socket.remoteAddress : 'unknown') + ':' + (s._socket ? s._socket.remotePort : 'unknown'); })); // Adicionado verificação _socket para segurança
    });
    app.post('/addPeer', function (req, res) {
        connectToPeers(req.body.peer);
        res.send();
    });
    app.listen(myHttpPort, function () {
        console.log('Listening http on port: ' + myHttpPort);
    });
};
// 14. Chamada para iniciar o servidor
var HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3001;
initHttpServer(HTTP_PORT);
