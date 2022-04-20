import { NssInfoType } from 'app/interfaces/active-directory.interface';

export interface ActiveDirectoryConfig {
  allow_dns_updates: boolean;
  allow_trusted_doms: boolean;
  bindname: string;
  bindpw: string;
  createcomputer: string;
  disable_freenas_cache: boolean;
  dns_timeout: number;
  domainname: string;
  enable: boolean;
  id: number;
  kerberos_principal: string;
  kerberos_realm: number;
  netbiosalias: string[];
  netbiosname: string;
  nss_info: NssInfoType;
  restrict_pam: boolean;
  site: string;
  timeout: number;
  use_default_domain: boolean;
  verbose_logging: boolean;
  job_id?: number;
}

export interface LeaveActiveDirectory {
  username: string;
  password: string;
}
