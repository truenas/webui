export interface SshCredentials {
  id?: string;
  host: string;
  port: number;
  username: string;
  private_key: number;
  remote_host_key: string;
  connect_timeout: number;
}
