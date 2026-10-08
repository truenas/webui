import { CallResponse } from '@truenas/api-client';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Alert {
  args: unknown;
  datetime: ApiTimestamp;
  dismissed: boolean;
  formatted: string;
  id: string;
  key: string;
  klass: AlertClassName;
  last_occurrence: ApiTimestamp;
  level: AlertLevel;
  mail: string;
  node: string;
  one_shot: boolean;
  source: string;
  text: string;
  uuid: string;
}

export interface AlertCategory {
  id: string;
  title: string;
  classes: AlertClass[];
}

export interface AlertClass {
  id: AlertClassName;
  level: AlertLevel;
  title: string;
  proactive_support?: boolean;
}

export interface AlertClassSettings {
  level?: AlertLevel;
  policy?: AlertPolicy;
}

export interface AlertClasses {
  id: number;
  classes: Record<string, AlertClassSettings>;
}

export type AlertClassesUpdate = Omit<AlertClasses, 'id'>;

/** An alert as `alert.list` and `disk.temperature_alerts` declare it. */
export type AlertEntry = CallResponse<WebUiApiDirectory, 'alert.list'>[number];

/**
 * Middleware types `klass` and `level` as open strings the UI reads through its enums, and the
 * timestamps as strings although they arrive as `ApiTimestamp` envelopes.
 */
export function toAlert(alert: AlertEntry): Alert {
  return alert as unknown as Alert;
}
