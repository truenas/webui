import { Action } from '../../action';
import { PointerProps } from '../pointer/types';
declare const multitouch: ({ preventDefault, scale, rotate }?: PointerProps) => Action;
export default multitouch;
export declare const getIsTouchDevice: () => boolean;
