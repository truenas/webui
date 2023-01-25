import { NonAuthApiMethod } from 'app/interfaces/api-directory.interface';
import { Job } from 'app/interfaces/job.interface';

export enum MockWebsocketResponseType {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  Job = 'job',
  Call = 'call',
}

export interface MockWebsocketCallResponse {
  type: MockWebsocketResponseType.Call;
  method: NonAuthApiMethod;
  response: unknown;
  id?: number;
}

export interface MockWebsocketJobResponse {
  type: MockWebsocketResponseType.Job;
  method: NonAuthApiMethod;
  response: Job;
  id?: number;
}
