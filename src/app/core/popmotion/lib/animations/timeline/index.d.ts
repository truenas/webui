import { Action } from '../../action';
import { Instruction } from './types';
import { TweenProps } from '../tween/types';
declare const timeline: (instructions: Instruction[], { duration, elapsed, ease, loop, flip, yoyo }?: TweenProps) => Action;
export default timeline;
