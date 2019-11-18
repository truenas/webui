import { ActionFactory } from '../../action/vector';
export declare type ScrubberSubscription = {
    seek: (progress: number) => any;
};
declare const vectorScrubber: ActionFactory;
export default vectorScrubber;
