import { NfsProtocol } from 'app/enums/nfs-protocol.enum';

export interface NfsConfig {
  allow_nonroot: boolean;
  bindip: string[];
  id: number;
  mountd_log: boolean;
  mountd_port: number;
  rpclockd_port: number;
  rpcstatd_port: number;
  servers: number;
  statd_lockd_log: boolean;
  userd_manage_gids: boolean;
  protocols: NfsProtocol[];
  v4_domain: string;
  v4_krb: boolean;
  v4_krb_enabled: boolean;
  keytab_has_nfs_spn: boolean;
  managed_nfsd: boolean;
  rdma: boolean;
}

export type NfsConfigUpdate = Partial<Omit<NfsConfig, 'id' | 'v4_krb_enabled'>>;

export interface AddNfsPrincipal {
  username: string;
  password: string;
}
