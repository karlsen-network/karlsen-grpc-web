import {FlowGRPCWeb} from '@aspectron/flow-grpc-web';
//const FlowGRPCWeb = new FlowGRPCWeb();
import {IRPC, RPC as Rpc,
	SubscriberItem, SubscriberItemMap,
	QueueItem, PendingReqs, IData, IStream
} from '../types/custom-types';

export class RPC implements IRPC{
	isReady:boolean = false;
	client:FlowGRPCWeb;
	stream:IStream;
	queue:QueueItem[] = [];
	pending:PendingReqs;
	intakeHandler:Function|undefined;
	verbose:boolean = false;
	subscribers: SubscriberItemMap = new Map();

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

            let subscribers:SubscriberItem[]|undefined = this.subscribers.get(o.name);
			if(subscribers){
				subscribers.map(subscriber=>{
					subscriber.callback(o.payload)
				})
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
    subscribe<T, R>(subject:string, data:any={}, callback:Rpc.callback<R>):Rpc.SubPromise<T>{
		if(typeof data == 'function'){
			callback = data;
			data = {};
		}

		if(!this.client)
			return Promise.reject('not connected') as Rpc.SubPromise<T>;

		let eventName = subject.replace("notify", "").replace("Request", "Notification")
		eventName = eventName[0].toLowerCase()+eventName.substr(1);
		console.log("subscribe:eventName", eventName)

		let subscribers:SubscriberItem[]|undefined = this.subscribers.get(eventName);
		if(!subscribers){
			subscribers = [];
			this.subscribers.set(eventName, subscribers);
		}
		let uid = (Math.random()*100000 + Date.now()).toFixed(0);
		subscribers.push({uid, callback});

		let p = this.request(subject, data) as Rpc.SubPromise<T>;

		p.uid = uid;
		return p;
	}
	request<T>(method:string, data:any){
		return new Promise<T>((resolve, reject)=>{
			this.queue.push({method, data, resolve, reject});
			this.processQueue();
		})
	}

	subscribeChainChanged(callback:Rpc.callback<Rpc.ChainChangedNotification>){
		return this.subscribe<Rpc.NotifyChainChangedResponse, Rpc.ChainChangedNotification>("notifyChainChangedRequest", {}, callback);
	}
	subscribeBlockAdded(callback:Rpc.callback<Rpc.BlockAddedNotification>){
		return this.subscribe<Rpc.NotifyBlockAddedResponse, Rpc.BlockAddedNotification>("notifyBlockAddedRequest", {}, callback);
	}
	subscribeVirtualSelectedParentBlueScoreChanged(callback:Rpc.callback<Rpc.VirtualSelectedParentBlueScoreChangedNotification>){
		return this.subscribe<Rpc.NotifyVirtualSelectedParentBlueScoreChangedResponse, Rpc.VirtualSelectedParentBlueScoreChangedNotification>("notifyVirtualSelectedParentBlueScoreChangedRequest", {}, callback);
	}

	getBlock(hash:string){
		return this.request<Rpc.BlockResponse>('getBlockRequest', {hash, includeBlockVerboseData:true});
	}
	getTransactionsByAddresses(startingBlockHash:string, addresses:string[]){
		return this.request<Rpc.TransactionsByAddressesResponse>('getTransactionsByAddressesRequest', {startingBlockHash, addresses});
	}
	getUtxosByAddresses(addresses:string[]){
		return this.request<Rpc.UTXOsByAddressesResponse>('getUtxosByAddressesRequest', {addresses});
	}
	submitTransaction(tx: Rpc.SubmitTransactionRequest){
		return this.request<Rpc.SubmitTransactionResponse>('submitTransactionRequest', tx);
	}
	getVirtualSelectedParentBlueScore(){
		return this.request<Rpc.VirtualSelectedParentBlueScoreResponse>('getVirtualSelectedParentBlueScoreRequest', {});
	}
}