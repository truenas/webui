import { ApiCallDirectory, ApiCallMethod, ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobDirectory, ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';

export enum MockWebsocketResponseType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Job = 'job',
  Call = 'call',
}

export interface MockWebsocketCallResponse {
  type: MockWebsocketResponseType.Call;
  method: ApiCallMethod;
  response: unknown;
  id?: number;
}

export interface MockWebsocketJobResponse {
  type: MockWebsocketResponseType.Job;
  method: ApiJobMethod;
  response: Job | ((params: unknown) => Job);
  id?: number;
}
export type CallResponseOrFactory<M extends ApiCallMethod> =
  | ApiCallDirectory[M]['response']
  | ((params: ApiCallParams<M>) => ApiCallDirectory[M]['response']);

export type JobResponseOrFactory<M extends ApiJobMethod> =
  | Job<ApiJobDirectory[M]['response']>
  | ((params: ApiJobParams<M>) => Job<ApiJobDirectory[M]['response']>);
