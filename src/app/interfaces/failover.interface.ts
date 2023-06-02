export interface FailoverConfig {
  disabled: boolean;
  id: number;
  master: boolean;
  timeout: number;
}

export type FailoverUpdate = Omit<FailoverConfig, 'id'>;

export type FailoverRemoteCall = [
  method: string,
  arguments?: unknown,
  params?: FailoverRemoteCallParams,
];

export interface FailoverRemoteCallParams {
  timeout?: number;
  job?: boolean;
  job_return?: boolean;
  callback?: unknown;
}

export interface FailoverUpgradeParams {
  resume?: boolean;
  resume_manual?: boolean;
}
