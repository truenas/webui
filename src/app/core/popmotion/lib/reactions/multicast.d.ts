import { ObserverProps } from '../observer/types';
import { BaseMulticast } from './';
export declare class Multicast extends BaseMulticast<Multicast> {
    create(props: ObserverProps): Multicast;
}
declare const _default: () => Multicast;
export default _default;
