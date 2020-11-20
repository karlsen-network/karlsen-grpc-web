/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, Api } from '../types/custom-types';
interface QueueItem {
    method: string;
    data: any;
    resolve: Function;
    reject: Function;
}
export declare class RPC implements IRPC {
    isReady: boolean;
    client: FlowGRPCWeb;
    stream: any;
    queue: QueueItem[];
    pending: QueueItem[];
    constructor(options?: any);
    processQueue(): void;
    request(method: string, data: any, resolve: Function, reject: Function): void;
    getBlock(blockHash: string): Promise<Api.BlockResponse>;
    getAddressTransactions(address: string, limit: number, skip: number): Promise<Api.Transaction[]>;
    getUtxos(address: string, limit: number, skip: number): Promise<Api.Utxo[]>;
    postTx(rawTransaction: string): Promise<Api.SuccessResponse>;
}
export {};
//# sourceMappingURL=rpc.d.ts.map