import { IObserver, ObserverCandidate, ObserverProps, PartialObserver } from './types';
export declare class Observer implements IObserver {
    private isActive;
    private observer;
    private updateObserver;
    private onComplete;
    constructor({middleware, onComplete}: ObserverProps, observer: PartialObserver);
    update: (v: any) => void;
    complete: () => void;
    error: (err: any) => void;
}
declare const _default: (observerCandidate: ObserverCandidate, { middleware }: ObserverProps, onComplete?: Function) => Observer;
export default _default;
