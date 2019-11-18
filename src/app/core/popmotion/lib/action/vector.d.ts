import { Action } from './';
export declare type Props = {
    [key: string]: any;
};
export declare type ActionFactory = (props: Props) => Action;
export declare type TypeTest = (v: any) => boolean;
export declare type TypeTestMap = {
    [key: string]: TypeTest;
};
export declare type ActionMap = {
    [key: string]: Action;
};
export declare type VectorActionFactory = (init: ActionFactory, typeTests: TypeTestMap) => ActionFactory;
declare const createVectorAction: VectorActionFactory;
export default createVectorAction;
