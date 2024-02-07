export interface FailoverConfig {
  disabled: boolean;
  id: number;
  master: boolean;
  timeout: number;
}

export type FailoverUpdate = Omit<FailoverConfig, 'id'>;

export interface FailoverUpgradeParams {
  resume?: boolean;
  resume_manual?: boolean;
}
