import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';

export interface Service {
  enable: boolean;
  id: number;
  pids: number[];
  service: ServiceName;
  state: ServiceStatus;
}

export interface ServiceRow extends Service {
  name: string;
}

export interface ServiceControlOptions {
  /**
   * Defaults to `true`.
   */
  ha_propagate?: boolean;

  /**
   * Return false instead of an error if the operation fails.
   * Defaults to `true`.
   */
  silent?: boolean;

  timeout?: number | null;
}
