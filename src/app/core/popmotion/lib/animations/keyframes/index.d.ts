import { Action } from '../../action';
import { KeyframeProps } from './types';
declare const keyframes: ({ easings, ease, times, values, ...tweenProps }: KeyframeProps) => Action;
export default keyframes;
