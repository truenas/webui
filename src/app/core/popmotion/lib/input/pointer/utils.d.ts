import { PointerPoint } from './types';
export declare const defaultPointerPos: () => PointerPoint;
export declare const eventToPoint: (e: Touch | MouseEvent, point?: PointerPoint) => PointerPoint;
