export interface NfsConfig {
  allow_nonroot: boolean;
  bindip: string[];
  id: number;
  mountd_log: boolean;
  mountd_port: string;
  rpclockd_port: string;
  rpcstatd_port: string;
  servers: number;
  statd_lockd_log: boolean;
  udp: boolean;
  userd_manage_gids: boolean;
  v4: boolean;
  v4_domain: string;
  v4_krb: boolean;
  v4_krb_enabled: boolean;
  v4_v3owner: boolean;
}

export type NfsConfigUpdate = Omit<NfsConfig, 'id' | 'v4_krb_enabled'>;

export interface AddNfsPrincipal {
  username: string;
  password: string;
}
