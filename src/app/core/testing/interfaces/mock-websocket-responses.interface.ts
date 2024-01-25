import { ApiCallDirectory, ApiCallMethod, ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobDirectory, ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
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
  | ApiCallDirectory[M]['response']
  | ((params: ApiCallParams<M>) => ApiCallDirectory[M]['response']);

export type JobResponseOrFactory<M extends ApiJobMethod> =
  | Job<ApiJobDirectory[M]['response']>
  | ((params: ApiJobParams<M>) => Job<ApiJobDirectory[M]['response']>);
