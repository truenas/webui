import { CallResponse } from '@truenas/api-client';
import { Weekday } from 'app/enums/weekday.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface ResilverConfig {
  begin: string;
  enabled: boolean;
  end: string;
  id: number;
  weekday: Weekday[];
}

/** Reads `pool.resilver.config`. Middleware leaves the defaulted fields optional and types weekdays as numbers. */
export function toResilverConfig(config: CallResponse<WebUiApiDirectory, 'pool.resilver.config'>): ResilverConfig {
  return config as ResilverConfig;
}
