import { CipherType } from 'app/enums/cipher-type.enum';
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
    password: string;
    username: string;
    connect_timeout: number;
    cipher: CipherType;
    token?: string;
    otp_token?: string;
  };
}

export interface RemoteSshScanParams {
  connect_timeout?: number;
  host: string;
  port: number;
}

export interface SshSemiAutomaticSetup {
  name: string;
  url: string;
  token?: string;
  password?: string;
  username?: string;
  otp_token?: string;
  private_key: number;
  cipher?: CipherType;
  connect_timeout?: number;
}
