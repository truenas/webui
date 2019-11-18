import { Value } from '../../reactions/value';
import { Action } from '../../action';
import { Easing } from '../../easing';
export declare type AnimationDefinition = {
    track: string;
    from?: Value;
    to?: Value;
    duration?: number;
    ease?: Easing;
    at?: number;
};
export declare type Instruction = number | string | AnimationDefinition | Array<AnimationDefinition | number>;
export declare type Tracks = {
    [key: string]: AnimationDefinition[];
};
export declare type TrackActions = {
    [key: string]: Action;
};
