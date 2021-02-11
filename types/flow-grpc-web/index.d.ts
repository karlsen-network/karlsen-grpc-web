declare module '@aspectron/flow-grpc-web'{
	export function dpc(delay: number | Function, fn ? : Function | number):number;
	export function clearDPC(n:number);
	export class FlowGRPCWeb{
		constructor(options:any);
		on(eventName:string, cb:Function);
	}
}
