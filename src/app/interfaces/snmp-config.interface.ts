export interface SnmpConfig {
  community: string;
  contact: string;
  id: number;
  location: string;
  loglevel: number;
  options: string;
  traps: boolean;
  v3: boolean;
  v3_authtype: string;
  v3_password: string;
  v3_privpassphrase: string;
  v3_privproto: string;
  v3_username: string;
  zilstat: boolean;
}

export type SnmpConfigUpdate = Omit<SnmpConfig, 'id' | 'traps'>;
