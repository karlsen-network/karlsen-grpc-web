import {FlowGRPCWeb} from '@aspectron/flow-grpc-web';
//const FlowGRPCWeb = new FlowGRPCWeb();
import {IRPC, Api} from '../types/custom-types';
interface QueueItem{
	method:string,
	data:any,
	resolve:Function,
	reject:Function
}

export class RPC implements IRPC{
	isReady:boolean = false;
	client:FlowGRPCWeb;
	stream:any;
	queue:QueueItem[] = [];
	pending:QueueItem[] = [];

	constructor(options:any={}){
		this.client = new FlowGRPCWeb(options.grpc||{});

		this.client.on("ready", (clients:any)=>{
			console.log("gRPCWeb::::clients", clients)
			let {RPC} = clients;

			const stream = RPC.MessageStream();
			this.stream = stream;
			console.log("stream", stream)
			stream.on("data", (data:string)=>{
				console.log("stream data", data)
				let item:QueueItem|undefined = this.pending.shift();
				if(item){
					item.resolve(data);
				}
			})
			stream.on("end", ()=>{
				console.log("stream end")
			});

			this.isReady = true;
			this.processQueue();
		})
	}
	processQueue(){
		if(!this.isReady)
			return
		let item:QueueItem|undefined = this.queue.shift();
		while(item){
			let req:any = {};
			req[item.method] = item.data;
			this.pending.push(item);
			this.stream.write(req);
			item = this.queue.shift();
		}
	}
	request(method:string, data:any, resolve:Function, reject:Function){
		this.queue.push({method, data, resolve, reject});
		this.processQueue();
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