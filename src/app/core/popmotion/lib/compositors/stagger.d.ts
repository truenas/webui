import { Action } from '../action';
declare const stagger: (actions: Action[], interval: number | ((i: number) => number)) => Action;
export default stagger;
