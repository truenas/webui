export interface SmbConfig {
  aapl_extensions: boolean;
  admin_group: string;
  bindip: string[];
  cifs_SID: string;
  description: string;
  dirmask: string;
  enable_smb1: boolean;
  filemask: string;
  guest: string;
  id: number;
  localmaster: boolean;
  loglevel: string; // enum MINIMUM
  netbiosalias: unknown[];
  netbiosname: string;
  netbiosname_b: string;
  netbiosname_local: string;
  next_rid: number;
  ntlmv1_auth: boolean;
  smb_options: string;
  syslog: boolean;
  unixcharset: string;
  workgroup: string;
}
