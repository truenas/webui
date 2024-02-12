import {
  ApiCallMethod,
  ApiCallParams,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import {
  ApiJobMethod,
  ApiJobParams,
  ApiJobResponse,
} from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';

export enum MockWebSocketResponseType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Job = 'job',
  Call = 'call',
}

export interface MockWebSocketCallResponse {
  type: MockWebSocketResponseType.Call;
  method: ApiCallMethod;
  response: unknown;
  id?: number;
}

export interface MockWebSocketJobResponse {
  type: MockWebSocketResponseType.Job;
  method: ApiJobMethod;
  response: Job | ((params: unknown) => Job);
  id?: number;
}
export type CallResponseOrFactory<M extends ApiCallMethod> =
  | ApiCallResponse<M>
  | ((params: ApiCallParams<M>) => ApiCallResponse<M>);

export type JobResponseOrFactory<M extends ApiJobMethod> =
  | Job<ApiJobResponse<M>>
  | ((params: ApiJobParams<M>) => Job<ApiJobResponse<M>>);
