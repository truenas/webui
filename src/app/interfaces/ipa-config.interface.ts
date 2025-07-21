import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IdmapBase } from 'app/interfaces/active-directory-config.interface';

export interface IpaSmbDomain extends IdmapBase {
  idmap_backend: IdmapBackend.Sss;
  domain_name: string | null;
  domain_sid: string | null;
}

export interface IpaConfig {
  target_server: string;
  hostname: string;
  domain: string;
  basedn: string;
  smb_domain: IpaSmbDomain | null;
  validate_certificates: boolean;
}
