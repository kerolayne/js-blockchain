class Block{
    public index: number;
    public hash: string;
    public previousHash: string;
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
    CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
}

const genesisBlock: Block = new Block(
    0, // <-- Esta é uma entrada
    '816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', // <-- Já discutimos esta (o hash)
    null, // <-- Esta é uma entrada
    1465154705, // <-- Esta é uma entrada
    'my genesis block!!' // <-- Esta é uma entrada
);

const generateNextBlock = (blockData: string) => {
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

    // 6. Retorna o novo bloco gerado
    return newBlock;
};

const Blockchain: Block[] = [genesisBlock];

const isValidNewBlock = (newBlock: Block, previousBlock: Block) => {
    // 1. Verifica se o índice do novo bloco está correto
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    }
    // 2. Verifica se o previousHash do novo bloco corresponde ao hash do bloco anterior
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    }
    // 3. Verifica se o hash do próprio novo bloco foi calculado corretamente
    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        // Linhas de depuração (debug) para ajudar a identificar problemas de tipo ou valor
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    // Se todas as verificações passarem, o bloco é válido
    return true;
};

const isValidBlockStructure = (block: Block) => {
    return typeof block.index === 'number' // Verifica se o índice é um número
        && typeof block.hash === 'string' // Verifica se o hash é uma string
        && typeof block.previousHash === 'string' // Verifica se o previousHash é uma string
        && typeof block.timestamp === 'number' // Verifica se o timestamp é um número
        && typeof block.data === 'string'; // Verifica se o data é uma string
};

const isValidChain = (blockchainToValidate: Block[]): boolean => {
    const isValidGenesis = (block: Block): boolean => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock); // Verifica se o bloco é igual ao bloco gênesis
    }
    if(!isValidGenesis(blockchainToValidate[0])) {
        console.log('invalid genesis block');
        return false; // Se o bloco gênesis não for válido, retorna falso
    }
    for (let i = 1; i< blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false; // Se algum bloco não for válido, retorna falso
        }
    }
    return true; // Se todos os blocos forem válidos, retorna verdadeiro
};