export interface FailoverConfig {
  disabled: boolean;
  id: number;
  master: boolean;
  timeout: number;
}

export type FailoverUpdate = Omit<FailoverConfig, 'id'>;
