export interface DockerConfig {
  pool: string;
  dataset: string;
  id: number;
}

export interface DockerConfigUpdate {
  pool: string;
}

export enum DockerStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Initializing = 'INITIALIZING',
  Stopping = 'STOPPING',
  Stopped = 'STOPPED',
  Unconfigured = 'UNCONFIGURED',
  Failed = 'FAILED',
}

export interface DockerStatusResponse {
  status: DockerStatus;
  description: string;
}
