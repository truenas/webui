import { DockerStatus } from 'app/enums/docker-status.enum';

export interface DockerConfig {
  pool: string;
  dataset: string;
  id: number;
  nvidia: boolean;
}

export interface DockerConfigUpdate {
  pool?: string;
  nvidia?: boolean;
}

export interface DockerStatusData {
  status: DockerStatus;
  description: string;
}
