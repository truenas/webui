export declare type Update = Function;
export declare type Complete = () => any;
export declare type Error = (err?: any) => any;
export declare type ObserverEvent = (type?: string, v?: any) => any;
export declare type Middleware = (update: Update, complete?: Complete) => (v: any) => any;
export interface IObserver {
    update: Update;
    complete: Complete;
    error: Error;
}
export interface PartialObserver {
    update?: Update;
    complete?: Complete;
    error?: Error;
    registerParent?: Function;
}
export declare type ObserverProps = PartialObserver & {
    middleware?: Middleware[];
    onComplete?: Function;
};
export declare type ObserverFactory = (observerCandidate: ObserverCandidate, props: ObserverProps) => IObserver;
export declare type ObserverCandidate = Update | IObserver | PartialObserver;
