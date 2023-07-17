import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { Job } from 'app/interfaces/job.interface';

export enum MockWebsocketResponseType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Job = 'job',
  Call = 'call',
}

export interface MockWebsocketCallResponse {
  type: MockWebsocketResponseType.Call;
  method: ApiMethod;
  response: unknown;
  id?: number;
}

export interface MockWebsocketJobResponse {
  type: MockWebsocketResponseType.Job;
  method: ApiMethod;
  response: Job;
  id?: number;
}
