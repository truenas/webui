export declare type ModifyTarget = (v: number) => number;
export declare type Props = {
    velocity?: number;
    from?: number;
    modifyTarget?: ModifyTarget;
    power?: number;
    timeConstant?: number;
    restDelta?: number;
};
