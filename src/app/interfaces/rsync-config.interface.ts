export interface RsyncConfig {
  auxiliary: string;
  id: number;
  port: number;
}

export type RsyncConfigUpdate = Omit<RsyncConfig, 'id'>;
