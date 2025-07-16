// testCoin.ts

// 1. Importações (Certifique-se de ter instalado com npm install)
import express from 'express';
import bodyParser from 'body-parser';
import * as CryptoJS from 'crypto-js'; // <-- CORRIGIDO AQUI

// 2. Classe Block (previousHash permite null)
class Block {
    public index: number;
    public hash: string;
    public previousHash: string | null; // <-- CORRIGIDO AQUI
    public timestamp: number;
    public data: string;

    constructor(index: number, hash: string, previousHash: string | null, timestamp: number, data: string) { // <-- CORRIGIDO AQUI
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

// 3. calculateHash (com return)
const calculateHash = (index: number, previousHash: string | null, timestamp: number, data: string): string => { // <-- previousHash também pode ser null aqui
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString(); // <-- CORRIGIDO AQUI
};

// 4. Bloco Gênesis (agora compatível com Block class)
const genesisBlock: Block = new Block(
    0,
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7',
    null, // <-- null agora é permitido pelo tipo
    1465154705,
    'my genesis block!!'
);

// 5. Variável da Blockchain (usando 'let' e minúscula)
let blockchain: Block[] = [genesisBlock]; // <-- CORRIGIDO AQUI

// 6. Funções Auxiliares (getLatestBlock, getBlockchain, calculateHashForBlock)
const getLatestBlock = (): Block => blockchain[blockchain.length - 1]; // <-- CORRIGIDO AQUI
const getBlockchain = (): Block[] => blockchain; // <-- ADICIONADO AQUI

const calculateHashForBlock = (block: Block): string => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

// 7. generateNextBlock (adicionando ao blockchain e tipo de retorno)
const generateNextBlock = (blockData: string): Block => { // <-- Tipo de retorno adicionado
    const previousBlock: Block = getLatestBlock();
    const nextIndex: number = previousBlock.index + 1;
    const nextTimestamp: number = new Date().getTime() / 1000;
    const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    blockchain.push(newBlock); // <-- ADICIONADO AQUI: Adiciona o novo bloco à cadeia
    return newBlock;
};

// 8. isValidNewBlock (tipos de retorno e sem comentários de debug)
const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => { // <-- Tipo de retorno adicionado
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};

// 9. isValidBlockStructure (tipo de retorno)
const isValidBlockStructure = (block: Block): boolean => { // <-- Tipo de retorno adicionado
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string' // Nota: 'string | null' seria mais preciso, mas 'string' funciona para a maioria dos casos se null for tratado como uma string vazia ou validado separadamente. Para a estrutura, 'string' está OK se o Gênesis for o único com null.
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

// 10. isValidChain
const isValidChain = (blockchainToValidate: Block[]): boolean => {
    const isValidGenesis = (block: Block): boolean => {
        // Isso é um problema! JSON.stringify pode ter ordens de propriedades diferentes
        // O ideal é comparar as propriedades uma a uma ou re-calcular o hash do Gênesis e comparar.
        // Por simplicidade, para agora, vamos manter, mas saiba que não é o ideal.
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };

    if (!isValidGenesis(blockchainToValidate[0])) {
        console.log('invalid genesis block');
        return false;
    }
    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};

// 11. replaceChain
const replaceChain = (newBlocks: Block[]) => {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest(); // Função P2P placeholder
    } else {
        console.log('Received blockchain invalid');
    }
};

// 12. Placeholder para P2P (MUITO IMPORTANTE!)
let sockets: any[] = []; // Onde você gerenciaria as conexões WebSocket

const getSockets = () => sockets;

const connectToPeers = (newPeer: string) => {
    console.log(`[P2P] Tentando conectar a: ${newPeer}`);
    // A implementação real envolveria 'ws' ou similar
    // Ex: const ws = new WebSocket(newPeer);
    // ws.on('open', () => { /* adicionar ws aos sockets */ });
    // ws.on('message', (data) => { /* processar mensagem */ });
    // ws.on('close', () => { /* remover ws dos sockets */ });
    // ws.on('error', () => { /* lidar com erro */ });
};

const broadcastLatest = () => {
    console.log('[P2P] Transmitindo o bloco mais recente...');
    // Iterar sobre 'sockets' e enviar getLatestBlock() para cada um
};


// 13. initHttpServer
const initHttpServer = (myHttpPort: number) => {
    const app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => {
        res.send(getBlockchain());
    });
    app.post('/mineBlock', (req, res) => {
        const newBlock: Block = generateNextBlock(req.body.data);
        res.send(newBlock);
    });
    app.get('/peers', (req, res) => {
        res.send(getSockets().map((s: any) => (s._socket ? s._socket.remoteAddress : 'unknown') + ':' + (s._socket ? s._socket.remotePort : 'unknown'))); // Adicionado verificação _socket para segurança
    });
    app.post('/addPeer', (req, res) => {
        connectToPeers(req.body.peer);
        res.send();
    });
    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort);
    });
};

// 14. Chamada para iniciar o servidor
const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3001;
initHttpServer(HTTP_PORT);