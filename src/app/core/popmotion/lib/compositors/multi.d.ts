import { Action } from "../action";
import { ColdSubscription } from "../action/types";
export declare type ActionStarter<I> = (action: Action, key: I) => ColdSubscription;
export declare type MultiProps<A, T, V, I> = {
    getCount: (actions: A) => number;
    getFirst: (subs: T) => ColdSubscription;
    getOutput: () => V;
    mapApi: (subs: T, methodName: string) => (...args: any[]) => V;
    setProp: (output: V, name: I, value: any) => any;
    startActions: (actions: A, starter: ActionStarter<I>) => T;
};
declare const multi: <A, T, V, I>({ getCount, getFirst, getOutput, mapApi, setProp, startActions }: MultiProps<A, T, V, I>) => (actions: A) => Action;
export default multi;
