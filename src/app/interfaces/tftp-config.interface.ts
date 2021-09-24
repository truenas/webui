export interface TftpConfig {
  directory: string;
  host: string;
  id: number;
  newfiles: boolean;
  options: string;
  port: number;
  umask: string;
  username: string;
}

export type TftpConfigUpdate = Omit<TftpConfig, 'id'>;
