import * as CryptoJS from 'crypto-js';
import express from 'express';
import bodyParser from 'body-parser';

class Block{
    public index: number;
    public hash: string;
    public previousHash: string| null; // O bloco gênesis não tem previousHash, então pode ser null
    public timestamp:number;
    public data: string;

    constructor(index: number, hash: string, previousHash:string, timestamp: number, data:string){
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

const calculateHash = (index: number, previousHash: string, timestamp: number, data: string): string => {
    // PRECISA DO RETURN e .toString()
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

const genesisBlock: Block = new Block(
    0, // <-- Esta é uma entrada
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', // <-- Já discutimos esta (o hash)
    null, // <-- Esta é uma entrada
    1465154705, // <-- Esta é uma entrada
    'my genesis block!!' // <-- Esta é uma entrada
);

const getLatestBlock = (): Block => Blockchain[Blockchain.length - 1];

const calculateHashForBlock = (block: Block): string =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data);

const generateNextBlock = (blockData: string): Block => {
    // 1. Obtém o bloco mais recente da cadeia
    const previousBlock: Block = getLatestBlock();

    // 2. Calcula o índice do próximo bloco
    const nextIndex: number = previousBlock.index + 1;

    // 3. Gera o carimbo de tempo (timestamp) para o novo bloco
    const nextTimestamp: number = new Date().getTime() / 1000;

    // 4. Calcula o hash do próximo bloco
    const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);

    // 5. Cria uma nova instância de Block
    const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    blockchain.push(newBlock); // Adiciona o novo bloco à cadeia de blocos
    // 6. Retorna o novo bloco gerado
    return newBlock;
};

// Placeholder para a rede P2P - você precisará implementar isso de verdade!
let sockets: any[] = []; // Exemplo de onde sockets seriam armazenados
const getSockets = () => sockets;
const connectToPeers = (newPeer: string) => {
    console.log(`[P2P] Tentando conectar a: ${newPeer}`);
    // Implementação real de conexão WebSocket aqui
};
const broadcastLatest = () => {
    console.log('[P2P] Transmitindo o bloco mais recente...');
    // Lógica para enviar o bloco mais recente para todos os peers conectados
};

let blockchain: Block[] = [genesisBlock];

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
    // 1. Verifica se o índice do novo bloco está correto
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }
    // 2. Verifica se o previousHash do novo bloco corresponde ao hash do bloco anterior
    else if (previousBlock.hash !== newBlock.previousHash) { // Verifica se o hash do bloco anterior é igual ao previousHash do novo bloco
        // Linhas de depuração (debug) para ajudar a identificar problemas de tipo ou valor
        console.log('invalid previoushash');
        return false;
    }
    // 3. Verifica se o hash do próprio novo bloco foi calculado corretamente
    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock)); //
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash); //
        return false;
    }
    // Se todas as verificações passarem, o bloco é válido
    return true;
};

const isValidBlockStructure = (block: Block): boolean => {
    return typeof block.index === 'number' // Verifica se o índice é um número
        && typeof block.hash === 'string' // Verifica se o hash é uma string
        && typeof block.previousHash === 'string' // Verifica se o previousHash é uma string
        && typeof block.timestamp === 'number' // Verifica se o timestamp é um número
        && typeof block.data === 'string'; // Verifica se o data é uma string
};

const isValidChain = (blockchainToValidate: Block[]): boolean => {// Função para validar a cadeia de blocos
    const isValidGenesis = (block: Block): boolean => { // Função para verificar se o bloco é o bloco gênesis
        return JSON.stringify(block) === JSON.stringify(genesisBlock); // Verifica se o bloco é igual ao bloco gênesis
    }
    if(!isValidGenesis(blockchainToValidate[0])) {// Verifica se o primeiro bloco é o bloco gênesis
        // Se o bloco gênesis não for válido, imprime uma mensagem de erro
        console.log('invalid genesis block');
        return false; // Se o bloco gênesis não for válido, retorna falso
    }
    for (let i = 1; i< blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) { // Verifica se cada novo bloco é válido em relação ao bloco anterior
            return false; // Se algum bloco não for válido, retorna falso
        }
    }
    return true; // Se todos os blocos forem válidos, retorna verdadeiro
};

const replaceChain = (newBlocks: Block[]) => {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {// Verifica se a nova cadeia é válida e maior que a atual
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');// Mensagem de log para indicar que a cadeia está sendo substituída
        blockchain = newBlocks; // Substitui a cadeia atual pela nova cadeia
        broadcastLatest(); // Transmite o bloco mais recente para os outros nós
    }else {
        console.log('Received blockchain invalid'); // Mensagem de log para indicar que a nova cadeia é inválida
    }
};

const initHttpServer = (myHttpPort: number) => {
    const app = express(); // Cria uma instância do Express
    app.use(bodyParser.json());// Middleware para analisar o corpo das requisições como JSON

    app.get('/blocks', (req, res) => {
        res.send(getBlockchain()); // Retorna a cadeia de blocos atual
    });
    app.post('/mineBlock', (req, res) => {
        const newBlock : Block = generateNextBlock(req.body.data); // Gera um novo bloco com os dados fornecidos no corpo da requisição
        res.send(newBlock); // Retorna o novo bloco gerado
    });
    app.get('/peers', (req, res) => {
        res.send(getSockets().map((s:any) => s._socket.remoteAddress + ':' + s._socket.remotePort)); // Retorna uma lista de peers conectados
    });
    app.post('/addpeer', (req, res) => {
        connectToPeers(req.body.peer); // Conecta a um novo peer fornecido no corpo da requisição
        res.send(); // Responde sem conteúdo
    });
    app.listen(myHttpPort, () => {
        console.log('Listening http on port: ' + myHttpPort); // Mensagem de log para indicar que o servidor HTTP está ouvindo na porta especificada
    });

};
