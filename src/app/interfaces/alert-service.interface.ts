import { CallParams } from '@truenas/api-client';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface AlertServiceEdit {
  enabled?: boolean;
  level?: AlertLevel;
  name?: string;
  attributes?: {
    type?: AlertServiceType;
    [key: string]: string | number | boolean | string[] | number[] | null | undefined;
  };
}

export interface AlertService extends AlertServiceEdit {
  id: number;
  type__title: string;
}

/**
 * Reads an `alertservice.query` row. Middleware spells `level` as a literal and declares `attributes` as one
 * model per service type, which the form edits as one record.
 */
export function toAlertService(service: WebUiQueryEntity<'alertservice.query'>): AlertService {
  return service as unknown as AlertService;
}

export type AlertServiceCreateArgs = CallParams<WebUiApiDirectory, 'alertservice.create'>[0];

/**
 * `alertservice.create`, `update` and `test` take `attributes` as one model per service type, which the form
 * builds as one record. The payload is handed over unchanged.
 */
export function toAlertServiceCreateArgs(payload: AlertServiceEdit): AlertServiceCreateArgs {
  return payload as AlertServiceCreateArgs;
}
