var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { FlowGRPCWeb, dpc, clearDPC } from '@aspectron/flow-grpc-web';
export const Deferred = () => {
    let methods = {};
    let promise = new Promise((resolve, reject) => {
        methods = { resolve, reject };
    });
    Object.assign(promise, methods);
    return promise;
};
export class RPC {
    constructor(options = {}) {
        this.isReady = false;
        this.queue = [];
        this.reconnect = true;
        this.verbose = false;
        this.subscribers = new Map();
        this.isConnected = false;
        this.connectCBs = [];
        this.connectFailureCBs = [];
        this.errorCBs = [];
        this.disconnectCBs = [];
        this.options = Object.assign({
            reconnect: true,
            verbose: true,
            uid: (Math.random() * 1000).toFixed(0)
        }, options || {});
        this.log = Function.prototype.bind.call(console.log, console, `[Kaspa gRPC ${this.options.uid}]:`);
        this.verbose = this.options.verbose;
        this.pending = {};
        this.reconnect = this.options.reconnect;
        this.client = new FlowGRPCWeb(options.clientConfig || {});
        this.serviceClientSignal = Deferred();
        this.client.on("ready", (clients) => {
            console.log("gRPCWeb::::clients", clients);
            let { RPC } = clients;
            this.serviceClient = RPC;
            this.serviceClientSignal.resolve();
            /*
            const stream = RPC.MessageStream();
            this.stream = stream;
            console.log("stream", stream)
            stream.on("end", ()=>{
                console.log("stream end")
            });
            this.initIntake(stream);
            */
        });
        this.connect();
    }
    getServiceClient() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.serviceClientSignal;
            return this.serviceClient;
        });
    }
    connect() {
        this.reconnect = true;
        return this._connect();
    }
    _connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.reconnect = true;
            this.verbose && this.log('gRPC Client connecting to', this.options.clientConfig);
            const RPC = yield this.getServiceClient();
            this.stream = RPC.MessageStream();
            this.initIntake(this.stream);
            this.isReady = true;
            this.processQueue();
            const reconnect = () => {
                this._setConnected(false);
                if (this.reconnect_dpc) {
                    clearDPC(this.reconnect_dpc);
                    delete this.reconnect_dpc;
                }
                this.clearPending();
                delete this.stream;
                //delete this.client;
                if (this.reconnect) {
                    this.reconnect_dpc = dpc(1000, () => {
                        this._connect();
                    });
                }
            };
            this.stream.on('error', (error) => {
                // console.log("client:",error);
                this.errorCBs.forEach(fn => fn(error.toString(), error));
                this.verbose && this.log('stream:error', error);
                if ((error === null || error === void 0 ? void 0 : error.code) != 'TIMEOUT' || !this.isConnected)
                    reconnect();
            });
            this.stream.on('end', (...args) => {
                this.verbose && this.log('stream:end', ...args);
                reconnect();
            });
            yield new Promise((resolve) => {
                dpc(100, () => __awaiter(this, void 0, void 0, function* () {
                    let response = yield this.request('getVirtualSelectedParentBlueScoreRequest', {})
                        .catch(e => {
                        this.connectFailureCBs.forEach(fn => fn(e));
                    });
                    this.verbose && this.log("getVirtualSelectedParentBlueScoreRequest:response", response);
                    if (response && response.blueScore) {
                        this._setConnected(true);
                    }
                    resolve();
                }));
            });
        });
    }
    initIntake(stream) {
        stream.on('data', (data) => {
            this.log("initIntake:data", data);
            if (data.payload) {
                let name = data.payload;
                let payload = data[name];
                let ident = name.replace(/^get|Response$/ig, '').toLowerCase();
                this.handleIntake({ name, payload, ident });
            }
        });
    }
    handleIntake(o) {
        if (this.intakeHandler) {
            this.intakeHandler(o);
        }
        else {
            let handlers = this.pending[o.name];
            this.verbose && console.log('intake:', o, 'handlers:', handlers);
            if (handlers && handlers.length) {
                let pendingItem = handlers.shift();
                if (pendingItem)
                    pendingItem.resolve(o.payload);
            }
            let subscribers = this.subscribers.get(o.name);
            if (subscribers) {
                subscribers.map(subscriber => {
                    subscriber.callback(o.payload);
                });
            }
        }
    }
    setIntakeHandler(fn) {
        this.intakeHandler = fn;
    }
    processQueue() {
        if (!this.isReady)
            return;
        let item = this.queue.shift();
        while (item) {
            const resp = item.method.replace(/Request$/, 'Response');
            if (!this.pending[resp])
                this.pending[resp] = [];
            let handlers = this.pending[resp];
            handlers.push(item);
            let req = {};
            req[item.method] = item.data;
            this.stream.write(req);
            item = this.queue.shift();
        }
    }
    clearPending() {
        Object.keys(this.pending).forEach(key => {
            let list = this.pending[key];
            list.forEach(o => o.reject('closing by force'));
            this.pending[key] = [];
        });
    }
    _setConnected(isConnected) {
        if (this.isConnected == isConnected)
            return;
        this.log("_setConnected", this.isConnected, isConnected);
        this.isConnected = isConnected;
        let cbs = isConnected ? this.connectCBs : this.disconnectCBs;
        //console.log("this.isConnected", this.isConnected, cbs)
        cbs.forEach(fn => {
            fn();
        });
    }
    onConnect(callback) {
        this.connectCBs.push(callback);
        if (this.isConnected)
            callback();
    }
    onConnectFailure(callback) {
        this.connectFailureCBs.push(callback);
    }
    onError(callback) {
        this.errorCBs.push(callback);
    }
    onDisconnect(callback) {
        this.disconnectCBs.push(callback);
    }
    disconnect() {
        var _a;
        console.log("disconnect", (_a = this.stream) === null || _a === void 0 ? void 0 : _a.id);
        if (this.reconnect_dpc) {
            clearDPC(this.reconnect_dpc);
            delete this.reconnect_dpc;
        }
        this.reconnect = false;
        this.stream && this.stream.end();
        this.clearPending();
    }
    request(method, data) {
        return new Promise((resolve, reject) => {
            this.queue.push({ method, data, resolve, reject });
            this.processQueue();
        });
    }
    subscribe(subject, data = {}, callback) {
        if (typeof data == 'function') {
            callback = data;
            data = {};
        }
        if (!this.client)
            return Promise.reject('not connected');
        let eventName = this.subject2EventName(subject);
        console.log("subscribe:eventName", eventName);
        let subscribers = this.subscribers.get(eventName);
        if (!subscribers) {
            subscribers = [];
            this.subscribers.set(eventName, subscribers);
        }
        let uid = (Math.random() * 100000 + Date.now()).toFixed(0);
        subscribers.push({ uid, callback });
        let p = this.request(subject, data);
        p.uid = uid;
        return p;
    }
    subject2EventName(subject) {
        let eventName = subject.replace("notify", "").replace("Request", "Notification");
        return eventName[0].toLowerCase() + eventName.substr(1);
    }
    unSubscribe(subject, uid = '') {
        let eventName = this.subject2EventName(subject);
        let subscribers = this.subscribers.get(eventName);
        if (!subscribers)
            return;
        if (!uid) {
            this.subscribers.delete(eventName);
        }
        else {
            subscribers = subscribers.filter(sub => sub.uid != uid);
            this.subscribers.set(eventName, subscribers);
        }
    }
    subscribeChainChanged(callback) {
        return this.subscribe("notifyChainChangedRequest", {}, callback);
    }
    subscribeBlockAdded(callback) {
        return this.subscribe("notifyBlockAddedRequest", {}, callback);
    }
    subscribeVirtualSelectedParentBlueScoreChanged(callback) {
        return this.subscribe("notifyVirtualSelectedParentBlueScoreChangedRequest", {}, callback);
    }
    subscribeUtxosChanged(addresses, callback) {
        return this.subscribe("notifyUtxosChangedRequest", { addresses }, callback);
    }
    unSubscribeUtxosChanged(uid = '') {
        this.unSubscribe("notifyUtxosChangedRequest", uid);
    }
    getBlock(hash) {
        return this.request('getBlockRequest', { hash, includeBlockVerboseData: true });
    }
    getTransactionsByAddresses(startingBlockHash, addresses) {
        return this.request('getTransactionsByAddressesRequest', {
            startingBlockHash, addresses
        });
    }
    getUtxosByAddresses(addresses) {
        return this.request('getUtxosByAddressesRequest', { addresses });
    }
    submitTransaction(tx) {
        return this.request('submitTransactionRequest', tx);
    }
    getVirtualSelectedParentBlueScore() {
        return this.request('getVirtualSelectedParentBlueScoreRequest', {});
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3JwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQVdwRSxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsR0FBbUIsRUFBRTtJQUN6QyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDakIsSUFBSSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFDLEVBQUU7UUFDekMsT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDaEMsT0FBTyxPQUEwQixDQUFDO0FBQ3RDLENBQUMsQ0FBQTtBQUVELE1BQU0sT0FBTyxHQUFHO0lBcUJmLFlBQVksVUFBWSxFQUFFO1FBcEIxQixZQUFPLEdBQVcsS0FBSyxDQUFDO1FBS3hCLFVBQUssR0FBZSxFQUFFLENBQUM7UUFHdkIsY0FBUyxHQUFXLElBQUksQ0FBQztRQUN6QixZQUFPLEdBQVcsS0FBSyxDQUFDO1FBQ3hCLGdCQUFXLEdBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDM0MsZ0JBQVcsR0FBUyxLQUFLLENBQUM7UUFDMUIsZUFBVSxHQUFjLEVBQUUsQ0FBQztRQUMzQixzQkFBaUIsR0FBYyxFQUFFLENBQUM7UUFDbEMsYUFBUSxHQUFjLEVBQUUsQ0FBQztRQUN6QixrQkFBYSxHQUFjLEVBQUUsQ0FBQztRQU03QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDNUIsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUcsSUFBSTtZQUNkLEdBQUcsRUFBQyxDQUFDLElBQUksQ0FBQyxN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QUFFLFFBQW1EO1FBQzVGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBK0QsMkJBQTJCLEVBQUUsRUFBQyxTQUFTLEVBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6SSxDQUFDO0lBRUQsdUJBQXVCLENBQUMsTUFBVyxFQUFFO1FBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBb0IsaUJBQWlCLEVBQUUsRUFBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUNqRyxDQUFDO0lBQ0QsMEJBQTBCLENBQUMsaUJBQXdCLEVBQUUsU0FBa0I7UUFDdEUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFzQyxtQ0FBbUMsRUFBRTtZQUM3RixpQkFBaUIsRUFBRSxTQUFTO1NBQzVCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFDRCxtQkFBbUIsQ0FBQyxTQUFrQjtRQUNyQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQStCLDRCQUE0QixFQUFFLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQztJQUM5RixDQUFDO0lBQ0QsaUJBQWlCLENBQUMsRUFBZ0M7UUFDakQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFnQywwQkFBMEIsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQsaUNBQWlDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBNkMsMENBQTBDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDakgsQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGbG93R1JQQ1dlYiwgZHBjLCBjbGVhckRQQ30gZnJvbSAnQGFzcGVjdHJvbi9mbG93LWdycGMtd2ViJztcbi8vY29uc3QgRmxvd0dSUENXZWIgPSBuZXcgRmxvd0dSUENXZWIoKTtcbmltcG9ydCB7SVJQQywgUlBDIGFzIFJwYyxcblx0U3Vic2NyaWJlckl0ZW0sIFN1YnNjcmliZXJJdGVtTWFwLFxuXHRRdWV1ZUl0ZW0sIFBlbmRpbmdSZXFzLCBJRGF0YSwgSVN0cmVhbVxufSBmcm9tICcuLi90eXBlcy9jdXN0b20tdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERlZmVycmVkUHJvbWlzZSBleHRlbmRzIFByb21pc2U8YW55PiB7XG4gICAgcmVzb2x2ZShkYXRhPzphbnkpOnZvaWQ7XG4gICAgcmVqZWN0KGVycm9yPzphbnkpOnZvaWQ7XG59XG5leHBvcnQgY29uc3QgRGVmZXJyZWQgPSAoKTogRGVmZXJyZWRQcm9taXNlPT57XG4gICAgbGV0IG1ldGhvZHMgPSB7fTtcbiAgICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpPT57XG4gICAgICAgIG1ldGhvZHMgPSB7cmVzb2x2ZSwgcmVqZWN0fTtcbiAgICB9KVxuICAgIE9iamVjdC5hc3NpZ24ocHJvbWlzZSwgbWV0aG9kcyk7XG4gICAgcmV0dXJuIHByb21pc2UgYXMgRGVmZXJyZWRQcm9taXNlO1xufVxuXG5leHBvcnQgY2xhc3MgUlBDIGltcGxlbWVudHMgSVJQQ3tcblx0aXNSZWFkeTpib29sZWFuID0gZmFsc2U7XG5cdG9wdGlvbnM6YW55O1xuXHRjbGllbnQ6Rmxvd0dSUENXZWI7XG5cdHJlY29ubmVjdF9kcGM6bnVtYmVyfHVuZGVmaW5lZDtcblx0c3RyZWFtOklTdHJlYW07XG5cdHF1ZXVlOlF1ZXVlSXRlbVtdID0gW107XG5cdHBlbmRpbmc6UGVuZGluZ1JlcXM7XG5cdGludGFrZUhhbmRsZXI6RnVuY3Rpb258dW5kZWZpbmVkO1xuXHRyZWNvbm5lY3Q6Ym9vbGVhbiA9IHRydWU7XG5cdHZlcmJvc2U6Ym9vbGVhbiA9IGZhbHNlO1xuXHRzdWJzY3JpYmVyczogU3Vic2NyaWJlckl0ZW1NYXAgPSBuZXcgTWFwKCk7XG5cdGlzQ29ubmVjdGVkOmJvb2xlYW49ZmFsc2U7XG5cdGNvbm5lY3RDQnM6RnVuY3Rpb25bXSA9IFtdO1xuXHRjb25uZWN0RmFpbHVyZUNCczpGdW5jdGlvbltdID0gW107XG5cdGVycm9yQ0JzOkZ1bmN0aW9uW10gPSBbXTtcblx0ZGlzY29ubmVjdENCczpGdW5jdGlvbltdID0gW107XG5cdHNlcnZpY2VDbGllbnQ6YW55O1xuXHRzZXJ2aWNlQ2xpZW50U2lnbmFsOiBEZWZlcnJlZFByb21pc2U7XG5cdGxvZzpGdW5jdGlvbjtcblxuXHRjb25zdHJ1Y3RvcihvcHRpb25zOmFueT17fSl7XG5cdFx0dGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0XHRyZWNvbm5lY3Q6IHRydWUsXG5cdFx0XHR2ZXJib3NlIDogdHJ1ZSxcblx0XHRcdHVpZDooTWF0aC5yYW5kb20oKSoxMDAwKS50b0ZpeGVkKDApXG5cdFx0fSwgb3B0aW9uc3x8e30pO1xuXG5cdFx0dGhpcy5sb2cgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZC5jYWxsKFxuXHRcdFx0Y29uc29sZS5sb2csXG5cdFx0XHRjb25zb2xlLFxuXHRcdFx0YFtLYXNwYSBnUlBDICR7dGhpcy5vcHRpb25zLnVpZH1dOmBcblx0XHQpO1xuXHRcdHRoaXMudmVyYm9zZSA9IHRoaXMub3B0aW9ucy52ZXJib3NlO1xuXHRcdHRoaXMucGVuZGluZyA9IHt9O1xuXHRcdHRoaXMucmVjb25uZWN0ID0gdGhpcy5vcHRpb25zLnJlY29ubmVjdDtcblx0XHR0aGlzLmNsaWVudCA9IG5ldyBGbG93R1JQQ1dlYihvcHRpb25zLmNsaWVudENvbmZpZ3x8e30pO1xuXG5cdFx0dGhpcy5zZXJ2aWNlQ2xpZW50U2lnbmFsID0gRGVmZXJyZWQoKTtcblxuXHRcdHRoaXMuY2xpZW50Lm9uKFwicmVhZHlcIiwgKGNsaWVudHM6YW55KT0+e1xuXHRcdFx0Y29uc29sZS5sb2coXCJnUlBDV2ViOjo6OmNsaWVudHNcIiwgY2xpZW50cylcblx0XHRcdGxldCB7UlBDfSA9IGNsaWVudHM7XG5cdFx0XHR0aGlzLnNlcnZpY2VDbGllbnQgPSBSUEM7XG5cdFx0XHR0aGlzLnNlcnZpY2VDbGllbnRTaWduYWwucmVzb2x2ZSgpO1xuXG5cdFx0XHQvKlxuXHRcdFx0Y29uc3Qgc3RyZWFtID0gUlBDLk1lc3NhZ2VTdHJlYW0oKTtcblx0XHRcdHRoaXMuc3RyZWFtID0gc3RyZWFtO1xuXHRcdFx0Y29uc29sZS5sb2coXCJzdHJlYW1cIiwgc3RyZWFtKVxuXHRcdFx0c3RyZWFtLm9uKFwiZW5kXCIsICgpPT57XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwic3RyZWFtIGVuZFwiKVxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLmluaXRJbnRha2Uoc3RyZWFtKTtcblx0XHRcdCovXG5cdFx0fSlcblx0XHR0aGlzLmNvbm5lY3QoKTtcblx0fVxuXHRhc3luYyBnZXRTZXJ2aWNlQ2xpZW50KCl7XG5cdFx0YXdhaXQgdGhpcy5zZXJ2aWNlQ2xpZW50U2lnbmFsO1xuXHRcdHJldHVybiB0aGlzLnNlcnZpY2VDbGllbnQ7XG5cdH1cblx0Y29ubmVjdCgpe1xuXHRcdHRoaXMucmVjb25uZWN0ID0gdHJ1ZTtcblx0XHRyZXR1cm4gdGhpcy5fY29ubmVjdCgpO1xuXHR9XG5cdGFzeW5jIF9jb25uZWN0KCkge1xuXHRcdC8vIHRoaXMucmVjb25uZWN0ID0gdHJ1ZTtcblx0XHR0aGlzLnZlcmJvc2UgJiYgdGhpcy5sb2coJ2dSUEMgQ2xpZW50IGNvbm5lY3RpbmcgdG8nLCB0aGlzLm9wdGlvbnMuY2xpZW50Q29uZmlnKTtcblx0XHRjb25zdCBSUEMgPSBhd2FpdCB0aGlzLmdldFNlcnZpY2VDbGllbnQoKTtcblxuXHRcdHRoaXMuc3RyZWFtID0gUlBDLk1lc3NhZ2VTdHJlYW0oKTtcblx0XHR0aGlzLmluaXRJbnRha2UodGhpcy5zdHJlYW0pO1xuXHRcdHRoaXMuaXNSZWFkeSA9IHRydWU7XG5cdFx0dGhpcy5wcm9jZXNzUXVldWUoKTtcblxuXHRcdGNvbnN0IHJlY29ubmVjdCA9ICgpID0+IHtcblx0XHRcdHRoaXMuX3NldENvbm5lY3RlZChmYWxzZSk7XG5cdFx0XHRpZih0aGlzLnJlY29ubmVjdF9kcGMpIHtcblx0XHRcdFx0Y2xlYXJEUEModGhpcy5yZWNvbm5lY3RfZHBjKTtcblx0XHRcdFx0ZGVsZXRlIHRoaXMucmVjb25uZWN0X2RwYztcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5jbGVhclBlbmRpbmcoKTtcblx0XHRcdGRlbGV0ZSB0aGlzLnN0cmVhbTtcblx0XHRcdC8vZGVsZXRlIHRoaXMuY2xpZW50O1xuXHRcdFx0aWYodGhpcy5yZWNvbm5lY3QpIHtcblx0XHRcdFx0dGhpcy5yZWNvbm5lY3RfZHBjID0gZHBjKDEwMDAsICgpID0+IHtcblx0XHRcdFx0XHR0aGlzLl9jb25uZWN0KCk7XG5cdFx0XHRcdH0pXG5cdFx0XHR9XG5cdFx0fVxuXHRcdHRoaXMuc3RyZWFtLm9uKCdlcnJvcicsIChlcnJvcjphbnkpID0+IHtcblx0XHRcdC8vIGNvbnNvbGUubG9nKFwiY2xpZW50OlwiLGVycm9yKTtcblx0XHRcdHRoaXMuZXJyb3JDQnMuZm9yRWFjaChmbj0+Zm4oZXJyb3IudG9TdHJpbmcoKSwgZXJyb3IpKTtcblx0XHRcdHRoaXMudmVyYm9zZSAmJiB0aGlzLmxvZygnc3RyZWFtOmVycm9yJywgZXJyb3IpO1xuXHRcdFx0aWYoZXJyb3I/LmNvZGUgIT0gJ1RJTUVPVVQnIHx8ICF0aGlzLmlzQ29ubmVjdGVkKVxuXHRcdFx0XHRyZWNvbm5lY3QoKTtcblx0XHR9KVxuXHRcdHRoaXMuc3RyZWFtLm9uKCdlbmQnLCAoLi4uYXJnczphbnkpID0+IHtcblx0XHRcdHRoaXMudmVyYm9zZSAmJiB0aGlzLmxvZygnc3RyZWFtOmVuZCcsIC4uLmFyZ3MpO1xuXHRcdFx0cmVjb25uZWN0KCk7XG5cdFx0fSk7XG5cblx0XHRhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSk9Pntcblx0XHRcdGRwYygxMDAsIGFzeW5jKCk9Pntcblx0XHRcdFx0bGV0IHJlc3BvbnNlOmFueSA9IGF3YWl0IHRoaXMucmVxdWVzdCgnZ2V0VmlydHVhbFNlbGVjdGVkUGFyZW50Qmx1ZVNjb3JlUmVxdWVzdCcsIHt9KVxuXHRcdFx0XHQuY2F0Y2goZT0+e1xuXHRcdFx0XHRcdHRoaXMuY29ubmVjdEZhaWx1cmVDQnMuZm9yRWFjaChmbj0+Zm4oZSkpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHR0aGlzLnZlcmJvc2UgJiYgdGhpcy5sb2coXCJnZXRWaXJ0dWFsU2VsZWN0ZWRQYXJlbnRCbHVlU2NvcmVSZXF1ZXN0OnJlc3BvbnNlXCIsIHJlc3BvbnNlKVxuXHRcdFx0XHRpZihyZXNwb25zZSAmJiByZXNwb25zZS5ibHVlU2NvcmUpe1xuXHRcdFx0XHRcdHRoaXMuX3NldENvbm5lY3RlZCh0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHR9KVxuXHRcdH0pXG5cdH1cblx0aW5pdEludGFrZShzdHJlYW06SVN0cmVhbSkge1xuICAgICAgICBzdHJlYW0ub24oJ2RhdGEnLChkYXRhOmFueSkgPT4ge1xuICAgICAgICBcdHRoaXMubG9nKFwiaW5pdEludGFrZTpkYXRhXCIsIGRhdGEpXG4gICAgICAgICAgICBpZihkYXRhLnBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IGRhdGEucGF5bG9hZDtcbiAgICAgICAgICAgICAgICBsZXQgcGF5bG9hZCA9IGRhdGFbbmFtZV07XG4gICAgICAgICAgICAgICAgbGV0IGlkZW50ID0gbmFtZS5yZXBsYWNlKC9eZ2V0fFJlc3BvbnNlJC9pZywnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUludGFrZSh7bmFtZSwgcGF5bG9hZCwgaWRlbnR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGhhbmRsZUludGFrZShvOklEYXRhKSB7XG4gICAgICAgIGlmKHRoaXMuaW50YWtlSGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5pbnRha2VIYW5kbGVyKG8pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IGhhbmRsZXJzID0gdGhpcy5wZW5kaW5nW28ubmFtZV07XG4gICAgICAgICAgICB0aGlzLnZlcmJvc2UgJiYgY29uc29sZS5sb2coJ2ludGFrZTonLG8sJ2hhbmRsZXJzOicsaGFuZGxlcnMpO1xuICAgICAgICAgICAgaWYoaGFuZGxlcnMgJiYgaGFuZGxlcnMubGVuZ3RoKXtcbiAgICAgICAgICAgIFx0bGV0IHBlbmRpbmdJdGVtOlF1ZXVlSXRlbXx1bmRlZmluZWQgPSBoYW5kbGVycy5zaGlmdCgpO1xuICAgICAgICAgICAgXHRpZihwZW5kaW5nSXRlbSlcbiAgICAgICAgICAgICAgICBcdHBlbmRpbmdJdGVtLnJlc29sdmUoby5wYXlsb2FkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHN1YnNjcmliZXJzOlN1YnNjcmliZXJJdGVtW118dW5kZWZpbmVkID0gdGhpcy5zdWJzY3JpYmVycy5nZXQoby5uYW1lKTtcblx0XHRcdGlmKHN1YnNjcmliZXJzKXtcblx0XHRcdFx0c3Vic2NyaWJlcnMubWFwKHN1YnNjcmliZXI9Pntcblx0XHRcdFx0XHRzdWJzY3JpYmVyLmNhbGxiYWNrKG8ucGF5bG9hZClcblx0XHRcdFx0fSlcblx0XHRcdH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEludGFrZUhhbmRsZXIoZm46RnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5pbnRha2VIYW5kbGVyID0gZm47XG4gICAgfVxuXHRwcm9jZXNzUXVldWUoKXtcblx0XHRpZighdGhpcy5pc1JlYWR5KVxuXHRcdFx0cmV0dXJuXG5cblx0XHRsZXQgaXRlbTpRdWV1ZUl0ZW18dW5kZWZpbmVkID0gdGhpcy5xdWV1ZS5zaGlmdCgpO1xuXHRcdHdoaWxlKGl0ZW0pe1xuXHRcdFx0Y29uc3QgcmVzcCA9IGl0ZW0ubWV0aG9kLnJlcGxhY2UoL1JlcXVlc3QkLywnUmVzcG9uc2UnKTtcbiAgICAgICAgICAgIGlmKCF0aGlzLnBlbmRpbmdbcmVzcF0pXG4gICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nW3Jlc3BdID0gW107XG4gICAgICAgICAgICBsZXQgaGFuZGxlcnM6UXVldWVJdGVtW10gPSB0aGlzLnBlbmRpbmdbcmVzcF07XG4gICAgICAgICAgICBoYW5kbGVycy5wdXNoKGl0ZW0pO1xuXG5cdFx0XHRsZXQgcmVxOmFueSA9IHt9O1xuXHRcdFx0cmVxW2l0ZW0ubWV0aG9kXSA9IGl0ZW0uZGF0YTtcblx0XHRcdHRoaXMuc3RyZWFtLndyaXRlKHJlcSk7XG5cblx0XHRcdGl0ZW0gPSB0aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cdFx0fVxuXHR9XG5cdGNsZWFyUGVuZGluZygpIHtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5wZW5kaW5nKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgICBsZXQgbGlzdCA9IHRoaXMucGVuZGluZ1trZXldO1xuICAgICAgICAgICAgbGlzdC5mb3JFYWNoKG89Pm8ucmVqZWN0KCdjbG9zaW5nIGJ5IGZvcmNlJykpO1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nW2tleV0gPSBbXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgX3NldENvbm5lY3RlZChpc0Nvbm5lY3RlZDpib29sZWFuKXtcblx0XHRpZih0aGlzLmlzQ29ubmVjdGVkID09IGlzQ29ubmVjdGVkKVxuXHRcdFx0cmV0dXJuO1xuXHRcdHRoaXMubG9nKFwiX3NldENvbm5lY3RlZFwiLCB0aGlzLmlzQ29ubmVjdGVkLCBpc0Nvbm5lY3RlZClcblx0XHR0aGlzLmlzQ29ubmVjdGVkID0gaXNDb25uZWN0ZWQ7XG5cblx0XHRsZXQgY2JzID0gaXNDb25uZWN0ZWQ/dGhpcy5jb25uZWN0Q0JzOnRoaXMuZGlzY29ubmVjdENCcztcblx0XHQvL2NvbnNvbGUubG9nKFwidGhpcy5pc0Nvbm5lY3RlZFwiLCB0aGlzLmlzQ29ubmVjdGVkLCBjYnMpXG5cdFx0Y2JzLmZvckVhY2goZm49Pntcblx0XHRcdGZuKCk7XG5cdFx0fSlcblx0fVxuXG5cdG9uQ29ubmVjdChjYWxsYmFjazpGdW5jdGlvbil7XG5cdFx0dGhpcy5jb25uZWN0Q0JzLnB1c2goY2FsbGJhY2spXG5cdFx0aWYodGhpcy5pc0Nvbm5lY3RlZClcblx0XHRcdGNhbGxiYWNrKCk7XG5cdH1cblx0b25Db25uZWN0RmFpbHVyZShjYWxsYmFjazpGdW5jdGlvbil7XG5cdFx0dGhpcy5jb25uZWN0RmFpbHVyZUNCcy5wdXNoKGNhbGxiYWNrKVxuXHR9XG5cdG9uRXJyb3IoY2FsbGJhY2s6RnVuY3Rpb24pe1xuXHRcdHRoaXMuZXJyb3JDQnMucHVzaChjYWxsYmFjaylcblx0fVxuXHRvbkRpc2Nvbm5lY3QoY2FsbGJhY2s6RnVuY3Rpb24pe1xuXHRcdHRoaXMuZGlzY29ubmVjdENCcy5wdXNoKGNhbGxiYWNrKVxuXHR9XG5cblx0ZGlzY29ubmVjdCgpIHtcblx0XHRjb25zb2xlLmxvZyhcImRpc2Nvbm5lY3RcIiwgdGhpcy5zdHJlYW0/LmlkKVxuXHRcdGlmKHRoaXMucmVjb25uZWN0X2RwYykge1xuXHRcdFx0Y2xlYXJEUEModGhpcy5yZWNvbm5lY3RfZHBjKTtcblx0XHRcdGRlbGV0ZSB0aGlzLnJlY29ubmVjdF9kcGM7XG5cdFx0fVxuXHRcdHRoaXMucmVjb25uZWN0ID0gZmFsc2U7XG5cdFx0dGhpcy5zdHJlYW0gJiYgdGhpcy5zdHJlYW0uZW5kKCk7XG5cdFx0dGhpcy5jbGVhclBlbmRpbmcoKTtcblx0fVxuXHRyZXF1ZXN0PFQ+KG1ldGhvZDpzdHJpbmcsIGRhdGE6YW55KXtcblx0XHRyZXR1cm4gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCk9Pntcblx0XHRcdHRoaXMucXVldWUucHVzaCh7bWV0aG9kLCBkYXRhLCByZXNvbHZlLCByZWplY3R9KTtcblx0XHRcdHRoaXMucHJvY2Vzc1F1ZXVlKCk7XG5cdFx0fSlcblx0fVxuICAgIHN1YnNjcmliZTxULCBSPihzdWJqZWN0OnN0cmluZywgZGF0YTphbnk9e30sIGNhbGxiYWNrOlJwYy5jYWxsYmFjazxSPik6UnBjLlN1YlByb21pc2U8VD57XG5cdFx0aWYodHlwZW9mIGRhdGEgPT0gJ2Z1bmN0aW9uJyl7XG5cdFx0XHRjYWxsYmFjayA9IGRhdGE7XG5cdFx0XHRkYXRhID0ge307XG5cdFx0fVxuXG5cdFx0aWYoIXRoaXMuY2xpZW50KVxuXHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KCdub3QgY29ubmVjdGVkJykgYXMgUnBjLlN1YlByb21pc2U8VD47XG5cblx0XHRsZXQgZXZlbnROYW1lID0gdGhpcy5zdWJqZWN0MkV2ZW50TmFtZShzdWJqZWN0KTtcblx0XHRjb25zb2xlLmxvZyhcInN1YnNjcmliZTpldmVudE5hbWVcIiwgZXZlbnROYW1lKVxuXG5cdFx0bGV0IHN1YnNjcmliZXJzOlN1YnNjcmliZXJJdGVtW118dW5kZWZpbmVkID0gdGhpcy5zdWJzY3JpYmVycy5nZXQoZXZlbnROYW1lKTtcblx0XHRpZighc3Vic2NyaWJlcnMpe1xuXHRcdFx0c3Vic2NyaWJlcnMgPSBbXTtcblx0XHRcdHRoaXMuc3Vic2NyaWJlcnMuc2V0KGV2ZW50TmFtZSwgc3Vic2NyaWJlcnMpO1xuXHRcdH1cblx0XHRsZXQgdWlkID0gKE1hdGgucmFuZG9tKCkqMTAwMDAwICsgRGF0ZS5ub3coKSkudG9GaXhlZCgwKTtcblx0XHRzdWJzY3JpYmVycy5wdXNoKHt1aWQsIGNhbGxiYWNrfSk7XG5cblx0XHRsZXQgcCA9IHRoaXMucmVxdWVzdChzdWJqZWN0LCBkYXRhKSBhcyBScGMuU3ViUHJvbWlzZTxUPjtcblxuXHRcdHAudWlkID0gdWlkO1xuXHRcdHJldHVybiBwO1xuXHR9XG5cdHN1YmplY3QyRXZlbnROYW1lKHN1YmplY3Q6c3RyaW5nKXtcblx0XHRsZXQgZXZlbnROYW1lID0gc3ViamVjdC5yZXBsYWNlKFwibm90aWZ5XCIsIFwiXCIpLnJlcGxhY2UoXCJSZXF1ZXN0XCIsIFwiTm90aWZpY2F0aW9uXCIpXG5cdFx0cmV0dXJuIGV2ZW50TmFtZVswXS50b0xvd2VyQ2FzZSgpK2V2ZW50TmFtZS5zdWJzdHIoMSk7XG5cdH1cblxuXHR1blN1YnNjcmliZShzdWJqZWN0OnN0cmluZywgdWlkOnN0cmluZz0nJyl7XG5cdFx0bGV0IGV2ZW50TmFtZSA9IHRoaXMuc3ViamVjdDJFdmVudE5hbWUoc3ViamVjdCk7XG5cdFx0bGV0IHN1YnNjcmliZXJzOlN1YnNjcmliZXJJdGVtW118dW5kZWZpbmVkID0gdGhpcy5zdWJzY3JpYmVycy5nZXQoZXZlbnROYW1lKTtcblx0XHRpZighc3Vic2NyaWJlcnMpXG5cdFx0XHRyZXR1cm5cblx0XHRpZighdWlkKXtcblx0XHRcdHRoaXMuc3Vic2NyaWJlcnMuZGVsZXRlKGV2ZW50TmFtZSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRzdWJzY3JpYmVycyA9IHN1YnNjcmliZXJzLmZpbHRlcihzdWI9PnN1Yi51aWQhPXVpZClcblx0XHRcdHRoaXMuc3Vic2NyaWJlcnMuc2V0KGV2ZW50TmFtZSwgc3Vic2NyaWJlcnMpO1xuXHRcdH1cblx0fVxuXG5cdHN1YnNjcmliZUNoYWluQ2hhbmdlZChjYWxsYmFjazpScGMuY2FsbGJhY2s8UnBjLkNoYWluQ2hhbmdlZE5vdGlmaWNhdGlvbj4pe1xuXHRcdHJldHVybiB0aGlzLnN1YnNjcmliZTxScGMuTm90aWZ5Q2hhaW5DaGFuZ2VkUmVzcG9uc2UsIFJwYy5DaGFpbkNoYW5nZWROb3RpZmljYXRpb24+KFwibm90aWZ5Q2hhaW5DaGFuZ2VkUmVxdWVzdFwiLCB7fSwgY2FsbGJhY2spO1xuXHR9XG5cdHN1YnNjcmliZUJsb2NrQWRkZWQoY2FsbGJhY2s6UnBjLmNhbGxiYWNrPFJwYy5CbG9ja0FkZGVkTm90aWZpY2F0aW9uPil7XG5cdFx0cmV0dXJuIHRoaXMuc3Vic2NyaWJlPFJwYy5Ob3RpZnlCbG9ja0FkZGVkUmVzcG9uc2UsIFJwYy5CbG9ja0FkZGVkTm90aWZpY2F0aW9uPihcIm5vdGlmeUJsb2NrQWRkZWRSZXF1ZXN0XCIsIHt9LCBjYWxsYmFjayk7XG5cdH1cblx0c3Vic2NyaWJlVmlydHVhbFNlbGVjdGVkUGFyZW50Qmx1ZVNjb3JlQ2hhbmdlZChjYWxsYmFjazpScGMuY2FsbGJhY2s8UnBjLlZpcnR1YWxTZWxlY3RlZFBhcmVudEJsdWVTY29yZUNoYW5nZWROb3RpZmljYXRpb24+KXtcblx0XHRyZXR1cm4gdGhpcy5zdWJzY3JpYmU8UnBjLk5vdGlmeVZpcnR1YWxTZWxlY3RlZFBhcmVudEJsdWVTY29yZUNoYW5nZWRSZXNwb25zZSwgUnBjLlZpcnR1YWxTZWxlY3RlZFBhcmVudEJsdWVTY29yZUNoYW5nZWROb3RpZmljYXRpb24+KFwibm90aWZ5VmlydHVhbFNlbGVjdGVkUGFyZW50Qmx1ZVNjb3JlQ2hhbmdlZFJlcXVlc3RcIiwge30sIGNhbGxiYWNrKTtcblx0fVxuXG5cdHN1YnNjcmliZVV0eG9zQ2hhbmdlZChhZGRyZXNzZXM6c3RyaW5nW10sIGNhbGxiYWNrOlJwYy5jYWxsYmFjazxScGMuVXR4b3NDaGFuZ2VkTm90aWZpY2F0aW9uPil7XG5cdFx0cmV0dXJuIHRoaXMuc3Vic2NyaWJlPFJwYy5Ob3RpZnlVdHhvc0NoYW5nZWRSZXNwb25zZSwgUnBjLlV0eG9zQ2hhbmdlZE5vdGlmaWNhdGlvbj4oXCJub3RpZnlVdHhvc0NoYW5nZWRSZXF1ZXN0XCIsIHthZGRyZXNzZXN9LCBjYWxsYmFjayk7XG5cdH1cblxuXHR1blN1YnNjcmliZVV0eG9zQ2hhbmdlZCh1aWQ6c3RyaW5nPScnKXtcblx0XHR0aGlzLnVuU3Vic2NyaWJlKFwibm90aWZ5VXR4b3NDaGFuZ2VkUmVxdWVzdFwiLCB1aWQpO1xuXHR9XG5cblx0Z2V0QmxvY2soaGFzaDpzdHJpbmcpe1xuXHRcdHJldHVybiB0aGlzLnJlcXVlc3Q8UnBjLkJsb2NrUmVzcG9uc2U+KCdnZXRCbG9ja1JlcXVlc3QnLCB7aGFzaCwgaW5jbHVkZUJsb2NrVmVyYm9zZURhdGE6dHJ1ZX0pO1xuXHR9XG5cdGdldFRyYW5zYWN0aW9uc0J5QWRkcmVzc2VzKHN0YXJ0aW5nQmxvY2tIYXNoOnN0cmluZywgYWRkcmVzc2VzOnN0cmluZ1tdKXtcblx0XHRyZXR1cm4gdGhpcy5yZXF1ZXN0PFJwYy5UcmFuc2FjdGlvbnNCeUFkZHJlc3Nlc1Jlc3BvbnNlPignZ2V0VHJhbnNhY3Rpb25zQnlBZGRyZXNzZXNSZXF1ZXN0Jywge1xuXHRcdFx0c3RhcnRpbmdCbG9ja0hhc2gsIGFkZHJlc3Nlc1xuXHRcdH0pO1xuXHR9XG5cdGdldFV0eG9zQnlBZGRyZXNzZXMoYWRkcmVzc2VzOnN0cmluZ1tdKXtcblx0XHRyZXR1cm4gdGhpcy5yZXF1ZXN0PFJwYy5VVFhPc0J5QWRkcmVzc2VzUmVzcG9uc2U+KCdnZXRVdHhvc0J5QWRkcmVzc2VzUmVxdWVzdCcsIHthZGRyZXNzZXN9KTtcblx0fVxuXHRzdWJtaXRUcmFuc2FjdGlvbih0eDogUnBjLlN1Ym1pdFRyYW5zYWN0aW9uUmVxdWVzdCl7XG5cdFx0cmV0dXJuIHRoaXMucmVxdWVzdDxScGMuU3VibWl0VHJhbnNhY3Rpb25SZXNwb25zZT4oJ3N1Ym1pdFRyYW5zYWN0aW9uUmVxdWVzdCcsIHR4KTtcblx0fVxuXG5cdGdldFZpcnR1YWxTZWxlY3RlZFBhcmVudEJsdWVTY29yZSgpe1xuXHRcdHJldHVybiB0aGlzLnJlcXVlc3Q8UnBjLlZpcnR1YWxTZWxlY3RlZFBhcmVudEJsdWVTY29yZVJlc3BvbnNlPignZ2V0VmlydHVhbFNlbGVjdGVkUGFyZW50Qmx1ZVNjb3JlUmVxdWVzdCcsIHt9KTtcblx0fVxufSJdfQ==