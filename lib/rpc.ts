import {FlowGRPCWeb} from '@aspectron/flow-grpc-web';
//const FlowGRPCWeb = new FlowGRPCWeb();
import {IRPC, Api} from '../types/custom-types';
export class RPC implements IRPC{
	isReady:boolean = false;
	client:FlowGRPCWeb;
	stream:any;
	constructor(options:any={}){
		this.client = new FlowGRPCWeb(options.grpc||{});
		this.client.on("ready", (clients:any)=>{
			console.log("gRPCWeb::::clients", clients)
			let {RPC} = clients;

			const stream = RPC.MessageStream();
			console.log("stream", stream)
			stream.on("data", (data:string)=>{
				console.log("stream data", data)
			})
			stream.on("end", ()=>{
				console.log("stream end")
			});

			this.isReady = true;
		})
	}
	request(method:string, req:any, resolve:Function, reject:Function){
		
	}
	getBlock(blockHash:string): Promise<Api.BlockResponse>{
		return new Promise((resolve, reject)=>{
			this.request('getBlock', {blockHash}, resolve, reject);
		})
	}
	getAddressTransactions(address:string, limit:number, skip:number): Promise<Api.Transaction[]>{
		return new Promise((resolve, reject)=>{
			this.request('getAddressTransactions', {address, limit, skip}, resolve, reject);
		})
	}
	getUtxos(address:string, limit:number, skip:number): Promise<Api.Utxo[]>{
		return new Promise((resolve, reject)=>{
			this.request('getUTXOsByAddressRequest', {address, limit, skip}, resolve, reject);
		})
	}
	postTx(rawTransaction: string): Promise<Api.SuccessResponse>{
		return new Promise((resolve, reject)=>{
			this.request('postTx', {rawTransaction}, resolve, reject);
		})
	}
}