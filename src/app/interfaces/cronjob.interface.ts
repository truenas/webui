import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Cronjob {
  command: string;
  description: string;
  enabled: boolean;
  id: number;
  schedule: Schedule;
  stderr: boolean;
  stdout: boolean;
  user: string;
}

/** Reads a `cronjob.query` row. Middleware leaves the defaulted fields optional, the schedule's included. */
export function toCronjob(cronjob: WebUiQueryEntity<'cronjob.query'>): Cronjob {
  return cronjob as Cronjob;
}
