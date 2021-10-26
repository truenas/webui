export interface KerberosConfig {
  appdefaults_aux: string;
  id: number;
  libdefaults_aux: string;
}

export type KerberosConfigUpdate = Omit<KerberosConfig, 'id'>;

export interface KerberosKeytab {
  file: string;
  id: number;
  name: string;
}

export type KerberosKeytabUpdate = Omit<KerberosKeytab, 'id'>;
