import {FlowGRPCWeb} from '@aspectron/flow-grpc-web';
//const FlowGRPCWeb = new FlowGRPCWeb();
import {IRPC, Api} from '../types/custom-types';
interface QueueItem{
	method:string,
	data:any,
	resolve:Function,
	reject:Function
}
interface PendingReqs {
	[index:string]:QueueItem[];
}
interface IData{
	name:string,
	payload:any,
	ident:string
}
declare type IStream = any;

export class RPC implements IRPC{
	isReady:boolean = false;
	client:FlowGRPCWeb;
	stream:IStream;
	queue:QueueItem[] = [];
	pending:PendingReqs;
	intakeHandler:Function|undefined;
	verbose:boolean = false;

	constructor(options:any={}){
		this.pending = {};
		this.client = new FlowGRPCWeb(options.grpc||{});

		this.client.on("ready", (clients:any)=>{
			console.log("gRPCWeb::::clients", clients)
			let {RPC} = clients;

			const stream = RPC.MessageStream();
			this.stream = stream;
			console.log("stream", stream)
			stream.on("end", ()=>{
				console.log("stream end")
			});
			this.initIntake(stream);
			this.isReady = true;
			this.processQueue();
		})
	}
	initIntake(stream:IStream) {
        stream.on('data',(data:any) => {
            if(data.payload) {
                let name = data.payload;
                let payload = data[name];
                let ident = name.replace(/^get|Response$/ig,'').toLowerCase();
                this.handleIntake({name, payload, ident});
            }
        });
    }
    handleIntake(o:IData) {
        if(this.intakeHandler) {
            this.intakeHandler(o);
        } else {
            let handlers = this.pending[o.name];
            this.verbose && console.log('intake:',o,'handlers:',handlers);
            if(handlers && handlers.length){
            	let pendingItem:QueueItem|undefined = handlers.shift();
            	if(pendingItem)
                	pendingItem.resolve(o.payload);
            }
        }
    }

    setIntakeHandler(fn:Function) {
        this.intakeHandler = fn;
    }
	processQueue(){
		if(!this.isReady)
			return

		let item:QueueItem|undefined = this.queue.shift();
		while(item){
			const resp = item.method.replace(/Request$/,'Response');
            if(!this.pending[resp])
                this.pending[resp] = [];
            let handlers:QueueItem[] = this.pending[resp];
            handlers.push(item);

			let req:any = {};
			req[item.method] = item.data;
			this.stream.write(req);

			item = this.queue.shift();
		}
	}
	clearPending() {
        Object.keys(this.pending).forEach(key => {
            let list = this.pending[key];
            list.forEach(o=>o.reject('closing by force'));
            this.pending[key] = [];
        });
    }
	request(method:string, data:any, resolve:Function, reject:Function){
		this.queue.push({method, data, resolve, reject});
		this.processQueue();
	}
	getBlock(hash:string): Promise<Api.BlockResponse>{
		return new Promise((resolve, reject)=>{
			this.request('getBlockRequest', {hash, includeBlockVerboseData:true}, resolve, reject);
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
	postTx(transactionHex: string): Promise<Api.SuccessResponse>{
		return new Promise((resolve, reject)=>{
			this.request('submitTransactionRequest', {transactionHex}, resolve, reject);
		})
	}
}