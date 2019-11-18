import { Easing } from '../../easing';
export declare type ValueMap = {
    [key: string]: string | number;
};
export declare type ValueList = string | number[];
export declare type Values = number[] | string[] | ValueMap[] | ValueList[];
export declare type KeyframeProps = {
    values: Values;
    times?: number[];
    ease?: Easing | Easing[] | {
        [key: string]: Easing;
    };
    easings?: Easing[];
    elapsed?: number;
    duration?: number;
    loop?: number;
    flip?: number;
    yoyo?: number;
};
