import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';

export interface AlertServiceCreate {
  enabled?: boolean;
  level?: AlertLevel;
  name?: string;
  type?: AlertServiceType;
  attributes?: {
    v3_authprotocol?: string;
    v3_privprotocol?: string;
    chat_ids?: number[];
    [attribute: string]: string | number | boolean | number[] | string[];
  };
}

export interface AlertService extends AlertServiceCreate {
  id: number;
  type__title: string;
}
