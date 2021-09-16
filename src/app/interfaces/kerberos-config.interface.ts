export interface KerberosConfig {
  appdefaults_aux: string;
  id: number;
  libdefaults_aux: string;
}

export interface KerberosKeytab {
  file: string;
  id: number;
  name: string;
}

export type KerberosKeytabUpdate = Omit<KerberosKeytab, 'id'>;
