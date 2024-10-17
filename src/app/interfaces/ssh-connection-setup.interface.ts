import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';

export interface SshConnectionSetup {
  setup_type: SshConnectionsSetupMethod;
  connection_name: string;
  private_key: {
    generate_key: boolean;
    name?: string;
    existing_key_id?: number;
  };
  manual_setup?: SshCredentials;
  semi_automatic_setup?: {
    url: string;
    admin_username: string;
    password: string;
    username: string;
    connect_timeout: number;
    token?: string;
    otp_token?: string;
    sudo?: boolean;
    verify_ssl?: boolean;
  };
}

export interface RemoteSshScanParams {
  connect_timeout?: number;
  host: string;
  port: number;
}
