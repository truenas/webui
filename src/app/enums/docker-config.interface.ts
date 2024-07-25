import { DockerStatus } from 'app/enums/docker-status.enum';

export interface DockerConfig {
  pool: string;
  dataset: string;
  id: number;
}

export interface DockerConfigUpdate {
  pool: string;
}

export interface DockerStatusResponse {
  status: DockerStatus;
  description: string;
}
