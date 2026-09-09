export interface SshCredentials {
  id?: string;
  host: string;
  /** Defaults to 22 on the appliance. */
  port?: number;
  /** Defaults to `root` on the appliance. */
  username?: string;
  private_key: number;
  remote_host_key: string;
  /** Defaults to 10 seconds on the appliance. */
  connect_timeout?: number;
}
