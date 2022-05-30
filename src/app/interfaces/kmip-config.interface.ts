export interface KmipConfig {
  id: number;
  enabled: boolean;
  manage_sed_disks: boolean;
  manage_zfs_keys: boolean;
  certificate: number;
  certificate_authority: number;
  port: number;
  server: string;
}

export interface KmipConfigUpdate extends Omit<KmipConfig, 'id'> {
  force_clear?: boolean;
  change_server?: boolean;
  validate?: boolean;
}
