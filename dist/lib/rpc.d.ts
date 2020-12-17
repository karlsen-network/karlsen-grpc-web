/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, RPC as Rpc, SubscriberItemMap, QueueItem, PendingReqs, IData, IStream } from '../types/custom-types';
export declare class RPC implements IRPC {
    isReady: boolean;
    client: FlowGRPCWeb;
    stream: IStream;
    queue: QueueItem[];
    pending: PendingReqs;
    intakeHandler: Function | undefined;
    verbose: boolean;
    subscribers: SubscriberItemMap;
    constructor(options?: any);
    initIntake(stream: IStream): void;
    handleIntake(o: IData): void;
    setIntakeHandler(fn: Function): void;
    processQueue(): void;
    clearPending(): void;
    subscribe<T, R>(subject: string, data: any, callback: Rpc.callback<R>): Rpc.SubPromise<T>;
    request<T>(method: string, data: any): Promise<T>;
    subscribeChainChanged(callback: Rpc.callback<Rpc.ChainChangedNotification>): Rpc.SubPromise<Rpc.NotifyChainChangedResponse>;
    subscribeBlockAdded(callback: Rpc.callback<Rpc.BlockAddedNotification>): Rpc.SubPromise<Rpc.NotifyBlockAddedResponse>;
    subscribeVirtualSelectedParentBlueScoreChanged(callback: Rpc.callback<Rpc.VirtualSelectedParentBlueScoreChangedNotification>): Rpc.SubPromise<Rpc.NotifyVirtualSelectedParentBlueScoreChangedResponse>;
    getBlock(hash: string): Promise<Rpc.BlockResponse>;
    getTransactionsByAddresses(startingBlockHash: string, addresses: string[]): Promise<Rpc.TransactionsByAddressesResponse>;
    getUtxosByAddresses(addresses: string[]): Promise<Rpc.UTXOsByAddressesResponse>;
    submitTransaction(tx: Rpc.SubmitTransactionRequest): Promise<Rpc.SubmitTransactionResponse>;
    getVirtualSelectedParentBlueScore(): Promise<Rpc.VirtualSelectedParentBlueScoreResponse>;
}
//# sourceMappingURL=rpc.d.ts.map