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
