import {
  ApiCallAndSubscribeMethod,
  ApiCallAndSubscribeResponse,
} from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import {
  ApiCallMethod,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import {
  ApiEventMethod,
  ApiEventTyped,
} from 'app/interfaces/api-message.interface';

export interface MockGlobalStoreResponses<
  M1 extends ApiCallMethod,
  M2 extends ApiEventMethod,
  M3 extends ApiCallAndSubscribeMethod,
> {
  call?: ApiCallResponse<M1>;
  subscribe?: ApiEventTyped<M2>;
  callAndSubscribe?: ApiCallAndSubscribeResponse<M3>[];
}
