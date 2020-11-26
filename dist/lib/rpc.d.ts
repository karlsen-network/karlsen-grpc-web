/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, Api } from '../types/custom-types';
interface QueueItem {
    method: string;
    data: any;
    resolve: Function;
    reject: Function;
}
interface PendingReqs {
    [index: string]: QueueItem[];
}
interface IData {
    name: string;
    payload: any;
    ident: string;
}
declare type IStream = any;
export declare class RPC implements IRPC {
    isReady: boolean;
    client: FlowGRPCWeb;
    stream: IStream;
    queue: QueueItem[];
    pending: PendingReqs;
    intakeHandler: Function | undefined;
    verbose: boolean;
    constructor(options?: any);
    initIntake(stream: IStream): void;
    handleIntake(o: IData): void;
    setIntakeHandler(fn: Function): void;
    processQueue(): void;
    clearPending(): void;
    request(method: string, data: any, resolve: Function, reject: Function): void;
    getBlock(hash: string): Promise<Api.BlockResponse>;
    getAddressTransactions(address: string, limit: number, skip: number): Promise<Api.Transaction[]>;
    getUtxos(address: string, limit: number, skip: number): Promise<Api.Utxo[]>;
    postTx(tx: Api.TransactionRequest): Promise<Api.TransactionResponse>;
}
export {};
//# sourceMappingURL=rpc.d.ts.map