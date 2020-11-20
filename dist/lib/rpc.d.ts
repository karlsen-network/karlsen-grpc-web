/// <reference types="flow-grpc-web" />
import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
import { IRPC, Api } from '../types/custom-types';
export declare class RPC implements IRPC {
    isReady: boolean;
    client: FlowGRPCWeb;
    constructor(options?: any);
    request(method: string, req: any, resolve: Function, reject: Function): void;
    getBlock(blockHash: string): Promise<Api.BlockResponse>;
    getAddressTransactions(address: string, limit: number, skip: number): Promise<Api.Transaction[]>;
    getUtxos(address: string, limit: number, skip: number): Promise<Api.Utxo[]>;
    postTx(rawTransaction: string): Promise<Api.SuccessResponse>;
}
//# sourceMappingURL=rpc.d.ts.map