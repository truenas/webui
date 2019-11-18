import { Action } from '../../action';
export interface EventListenerOptions {
    capture?: boolean;
    passive?: boolean;
    once?: boolean;
}
export declare type EventListener = (type: string, listener: Function, options?: EventListenerOptions | boolean) => void;
export declare type ListenFactory = (element: Element | Document | Window, events: string, options?: EventListenerOptions | boolean) => Action;
