import { FlowGRPCWeb } from '@aspectron/flow-grpc-web';
export class RPC {
    constructor(options = {}) {
        this.isReady = false;
        this.client = new FlowGRPCWeb(options.grpc || {});
        this.client.on("ready", (clients) => {
            console.log("gRPCWeb::::clients", clients);
            let { RPC } = clients;
            const stream = RPC.MessageStream();
            console.log("stream", stream);
            stream.on("data", (data) => {
                console.log("stream data", data);
            });
            stream.on("end", () => {
                console.log("stream end");
            });
            stream.write({
                getUTXOsByAddressRequest: {}
            });
            this.isReady = true;
        });
    }
    request(method, req, resolve, reject) {
    }
    getBlock(blockHash) {
        return new Promise((resolve, reject) => {
            this.request('getBlock', { blockHash }, resolve, reject);
        });
    }
    getAddressTransactions(address, limit, skip) {
        return new Promise((resolve, reject) => {
            this.request('getAddressTransactions', { address, limit, skip }, resolve, reject);
        });
    }
    getUtxos(address, limit, skip) {
        return new Promise((resolve, reject) => {
            this.request('getUtxos', { address, limit, skip }, resolve, reject);
        });
    }
    postTx(rawTransaction) {
        return new Promise((resolve, reject) => {
            this.request('postTx', { rawTransaction }, resolve, reject);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3JwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFHckQsTUFBTSxPQUFPLEdBQUc7SUFHZixZQUFZLFVBQVksRUFBRTtRQUYxQixZQUFPLEdBQVcsS0FBSyxDQUFDO1FBR3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksSUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFXLEVBQUMsRUFBRTtZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzFDLElBQUksRUFBQyxHQUFHLEVBQUMsR0FBRyxPQUFPLENBQUM7WUFFcEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQzdCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBVyxFQUFDLEVBQUU7Z0JBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO1lBQ2pDLENBQUMsQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRSxFQUFFO2dCQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQzFCLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDWix3QkFBd0IsRUFBQyxFQUFFO2FBQzNCLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQUNELE9BQU8sQ0FBQyxNQUFhLEVBQUUsR0FBTyxFQUFFLE9BQWdCLEVBQUUsTUFBZTtJQUVqRSxDQUFDO0lBQ0QsUUFBUSxDQUFDLFNBQWdCO1FBQ3hCLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBQyxTQUFTLEVBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUE7SUFDSCxDQUFDO0lBQ0Qsc0JBQXNCLENBQUMsT0FBYyxFQUFFLEtBQVksRUFBRSxJQUFXO1FBQy9ELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFDLEVBQUU7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2pGLENBQUMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQUNELFFBQVEsQ0FBQyxPQUFjLEVBQUUsS0FBWSxFQUFFLElBQVc7UUFDakQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsRUFBRTtZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQUNELE1BQU0sQ0FBQyxjQUFzQjtRQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxFQUFFO1lBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUMsY0FBYyxFQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGbG93R1JQQ1dlYn0gZnJvbSAnQGFzcGVjdHJvbi9mbG93LWdycGMtd2ViJztcbi8vY29uc3QgRmxvd0dSUENXZWIgPSBuZXcgRmxvd0dSUENXZWIoKTtcbmltcG9ydCB7SVJQQywgQXBpfSBmcm9tICcuLi90eXBlcy9jdXN0b20tdHlwZXMnO1xuZXhwb3J0IGNsYXNzIFJQQyBpbXBsZW1lbnRzIElSUEN7XG5cdGlzUmVhZHk6Ym9vbGVhbiA9IGZhbHNlO1xuXHRjbGllbnQ6Rmxvd0dSUENXZWI7XG5cdGNvbnN0cnVjdG9yKG9wdGlvbnM6YW55PXt9KXtcblx0XHR0aGlzLmNsaWVudCA9IG5ldyBGbG93R1JQQ1dlYihvcHRpb25zLmdycGN8fHt9KTtcblx0XHR0aGlzLmNsaWVudC5vbihcInJlYWR5XCIsIChjbGllbnRzOmFueSk9Pntcblx0XHRcdGNvbnNvbGUubG9nKFwiZ1JQQ1dlYjo6OjpjbGllbnRzXCIsIGNsaWVudHMpXG5cdFx0XHRsZXQge1JQQ30gPSBjbGllbnRzO1xuXG5cdFx0XHRjb25zdCBzdHJlYW0gPSBSUEMuTWVzc2FnZVN0cmVhbSgpO1xuXHRcdFx0Y29uc29sZS5sb2coXCJzdHJlYW1cIiwgc3RyZWFtKVxuXHRcdFx0c3RyZWFtLm9uKFwiZGF0YVwiLCAoZGF0YTpzdHJpbmcpPT57XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwic3RyZWFtIGRhdGFcIiwgZGF0YSlcblx0XHRcdH0pXG5cdFx0XHRzdHJlYW0ub24oXCJlbmRcIiwgKCk9Pntcblx0XHRcdFx0Y29uc29sZS5sb2coXCJzdHJlYW0gZW5kXCIpXG5cdFx0XHR9KTtcblxuXHRcdFx0c3RyZWFtLndyaXRlKHtcblx0XHRcdFx0Z2V0VVRYT3NCeUFkZHJlc3NSZXF1ZXN0Ont9XG5cdFx0XHR9KVxuXG5cdFx0XHR0aGlzLmlzUmVhZHkgPSB0cnVlO1xuXHRcdH0pXG5cdH1cblx0cmVxdWVzdChtZXRob2Q6c3RyaW5nLCByZXE6YW55LCByZXNvbHZlOkZ1bmN0aW9uLCByZWplY3Q6RnVuY3Rpb24pe1xuXG5cdH1cblx0Z2V0QmxvY2soYmxvY2tIYXNoOnN0cmluZyk6IFByb21pc2U8QXBpLkJsb2NrUmVzcG9uc2U+e1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xuXHRcdFx0dGhpcy5yZXF1ZXN0KCdnZXRCbG9jaycsIHtibG9ja0hhc2h9LCByZXNvbHZlLCByZWplY3QpO1xuXHRcdH0pXG5cdH1cblx0Z2V0QWRkcmVzc1RyYW5zYWN0aW9ucyhhZGRyZXNzOnN0cmluZywgbGltaXQ6bnVtYmVyLCBza2lwOm51bWJlcik6IFByb21pc2U8QXBpLlRyYW5zYWN0aW9uW10+e1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xuXHRcdFx0dGhpcy5yZXF1ZXN0KCdnZXRBZGRyZXNzVHJhbnNhY3Rpb25zJywge2FkZHJlc3MsIGxpbWl0LCBza2lwfSwgcmVzb2x2ZSwgcmVqZWN0KTtcblx0XHR9KVxuXHR9XG5cdGdldFV0eG9zKGFkZHJlc3M6c3RyaW5nLCBsaW1pdDpudW1iZXIsIHNraXA6bnVtYmVyKTogUHJvbWlzZTxBcGkuVXR4b1tdPntcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCk9Pntcblx0XHRcdHRoaXMucmVxdWVzdCgnZ2V0VXR4b3MnLCB7YWRkcmVzcywgbGltaXQsIHNraXB9LCByZXNvbHZlLCByZWplY3QpO1xuXHRcdH0pXG5cdH1cblx0cG9zdFR4KHJhd1RyYW5zYWN0aW9uOiBzdHJpbmcpOiBQcm9taXNlPEFwaS5TdWNjZXNzUmVzcG9uc2U+e1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KT0+e1xuXHRcdFx0dGhpcy5yZXF1ZXN0KCdwb3N0VHgnLCB7cmF3VHJhbnNhY3Rpb259LCByZXNvbHZlLCByZWplY3QpO1xuXHRcdH0pXG5cdH1cbn0iXX0=