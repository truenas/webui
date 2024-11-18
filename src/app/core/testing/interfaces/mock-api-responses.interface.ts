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

export enum MockApiResponseType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Job = 'job',
  Call = 'call',
}

export interface MockApiCallResponse {
  type: MockApiResponseType.Call;
  method: ApiCallMethod;
  response: unknown;
  id?: number;
}

export interface MockApiJobResponse {
  type: MockApiResponseType.Job;
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
