/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, RPC as Rpc, SubscriberItemMap, QueueItem, PendingReqs, IData, IStream } from '../types/custom-types';
export interface DeferredPromise extends Promise<any> {
    resolve(data?: any): void;
    reject(error?: any): void;
}
export declare const Deferred: () => DeferredPromise;
export declare class RPC implements IRPC {
    isReady: boolean;
    options: any;
    client: FlowGRPCWeb;
    reconnect_dpc: number | undefined;
    stream: IStream;
    queue: QueueItem[];
    pending: PendingReqs;
    intakeHandler: Function | undefined;
    reconnect: boolean;
    verbose: boolean;
    subscribers: SubscriberItemMap;
    isConnected: boolean;
    connectCBs: Function[];
    connectFailureCBs: Function[];
    errorCBs: Function[];
    disconnectCBs: Function[];
    serviceClient: any;
    serviceClientSignal: DeferredPromise;
    log: Function;
    constructor(options?: any);
    getServiceClient(): Promise<any>;
    connect(): Promise<void>;
    _connect(): Promise<void>;
    initIntake(stream: IStream): void;
    handleIntake(o: IData): void;
    setIntakeHandler(fn: Function): void;
    processQueue(): void;
    clearPending(): void;
    _setConnected(isConnected: boolean): void;
    onConnect(callback: Function): void;
    onConnectFailure(callback: Function): void;
    onError(callback: Function): void;
    onDisconnect(callback: Function): void;
    disconnect(): void;
    request<T>(method: string, data: any): Promise<T>;
    subscribe<T, R>(subject: string, data: any, callback: Rpc.callback<R>): Rpc.SubPromise<T>;
    subject2EventName(subject: string): string;
    unSubscribe(subject: string, uid?: string): void;
    subscribeChainChanged(callback: Rpc.callback<Rpc.ChainChangedNotification>): Rpc.SubPromise<Rpc.NotifyChainChangedResponse>;
    subscribeBlockAdded(callback: Rpc.callback<Rpc.BlockAddedNotification>): Rpc.SubPromise<Rpc.NotifyBlockAddedResponse>;
    subscribeVirtualSelectedParentBlueScoreChanged(callback: Rpc.callback<Rpc.VirtualSelectedParentBlueScoreChangedNotification>): Rpc.SubPromise<Rpc.NotifyVirtualSelectedParentBlueScoreChangedResponse>;
    subscribeUtxosChanged(addresses: string[], callback: Rpc.callback<Rpc.UtxosChangedNotification>): Rpc.SubPromise<Rpc.NotifyUtxosChangedResponse>;
    unSubscribeUtxosChanged(uid?: string): void;
    getBlock(hash: string): Promise<Rpc.BlockResponse>;
    getTransactionsByAddresses(startingBlockHash: string, addresses: string[]): Promise<Rpc.TransactionsByAddressesResponse>;
    getUtxosByAddresses(addresses: string[]): Promise<Rpc.UTXOsByAddressesResponse>;
    submitTransaction(tx: Rpc.SubmitTransactionRequest): Promise<Rpc.SubmitTransactionResponse>;
    getVirtualSelectedParentBlueScore(): Promise<Rpc.VirtualSelectedParentBlueScoreResponse>;
}
//# sourceMappingURL=rpc.d.ts.map