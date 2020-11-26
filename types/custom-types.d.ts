export type bytes = string;//base84 string

export namespace Api {
  interface Utxo {
    transactionId: string;
    value: number;
    scriptPubKey: string;
    acceptingBlockHash: string;
    acceptingBlockBlueScore: number;
    index: number;
    isSpent: boolean;
    isCoinbase: boolean;
    isSpendable: boolean;
    confirmations: number;
  }
  interface UtxoResponse {
    utxos: Utxo[];
  }
  interface ErrorResponse {
    errorCode: number;
    errorMessage: string;
  }
  interface SuccessResponse{
    success:boolean;
    message?:string
  }

  interface BlockResponse {
    blockHash: string;
    parentBlockHashes: string[];
    version: number;
    hashMerkleRoot: string;
    acceptedIdMerkleRoot: string;
    utxoCommitment: string;
    timestamp: number;
    bits: number;
    nonce: number;
    acceptingBlockHash: string;
    blueScore: number;
    isChainBlock: boolean;
    mass: number;
  }

  interface Hash{
    bytes:bytes
  }

  interface TransactionRequest{
    transaction:TransactionRequestTx
  }
  interface TransactionResponse{
    txId:string;
    error:RPCError;
  }

  interface TransactionRequestTx{
    version:number;
    inputs:TransactionRequestTxInput[];
    outputs:TransactionRequestTxOutput[];
    lockTime:number;
    subnetworkId:SubnetworkId;
    gas?:number;
    payloadHash?:Hash;
    payload?:bytes;
  }

  interface TransactionRequestTxInput{
    previousOutpoint:Outpoint;
    signatureScript:bytes;
    sequence:number;
  }

  interface Outpoint{
    transactionId:TransactionId
    index:number
  }

  interface TransactionId{
    bytes:bytes;
  }

  interface TransactionRequestTxOutput{
    value:number;
    scriptPubKey:bytes;
  }

  interface TransactionId{
    bytes:bytes;
  }
  

  interface TransactionInput {
    previousTransactionId: string;
    previousTransactionOutputIndex: string;
    scriptSig: string;
    sequence: string;
    address: string;
  }
  interface TransactionOutput {
    value: number;
    scriptPubKey: string;
    address: string;
  }
  export interface Transaction {
    transactionId: string;
    transactionHash: string;
    acceptingBlockHash: string;
    acceptingBlockBlueScore: number;
    subnetworkId: string;
    lockTime: number;
    gas: number;
    payloadHash: string;
    payload: string;
    inputs: Array<TransactionInput>;
    outputs: Array<TransactionOutput>;
    mass: number;
    confirmations: number;
  }

  interface TransactionsResponse {
    transactions: Transaction[];
  }
  type SendTxResponse = boolean;
}

export interface IRPC {
  getBlock(blockHash:string): Promise<Api.BlockResponse>;
  getAddressTransactions(address:string, limit:number, skip:number): Promise<Api.Transaction[]>;
  getUtxos(address:string, limit:number, skip:number): Promise<Api.UTXOsByAddressResponse>;
  postTx(tx: Api.TransactionRequest): Promise<Api.TransactionResponse>;
  request?(method:string, data:any, resolve:function, reject:function);
}


