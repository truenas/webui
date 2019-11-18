import { Action } from '../action';
declare const composite: (actions: {
    [key: string]: Action;
}) => Action;
export default composite;
