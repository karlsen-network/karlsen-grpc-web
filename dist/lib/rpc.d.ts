/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, RPC as Rpc } from '../types/custom-types';
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
    request(method: string, data: any): Promise<unknown>;
    getBlock(hash: string): Promise<Rpc.BlockResponse>;
    getTransactionsByAddresses(startingBlockHash: string, addresses: string[]): Promise<Rpc.TransactionsByAddressesResponse>;
    getUTXOsByAddress(addresses: string[]): Promise<Rpc.UTXOsByAddressesResponse>;
    submitTransaction(tx: Rpc.SubmitTransactionRequest): Promise<Rpc.SubmitTransactionResponse>;
}
export {};
//# sourceMappingURL=rpc.d.ts.map