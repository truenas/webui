import { JobParams } from '@truenas/api-client';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Tunable {
  comment: string;
  enabled: boolean;
  id: number;
  type: string;
  value: string;
  var: string;
  orig_value?: string;
}

export type TunableCreateArgs = JobParams<WebUiApiDirectory, 'tunable.create'>[0];

/** Reads a `tunable.query` row. Middleware leaves the defaulted `type`, `comment` and `enabled` optional. */
export function toTunable(tunable: WebUiQueryEntity<'tunable.query'>): Tunable {
  return tunable as Tunable;
}
