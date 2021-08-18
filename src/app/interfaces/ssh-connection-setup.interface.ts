import { CipherType } from 'app/enums/cipher-type.enum';
import { SshConnectionsSetupMethod } from 'app/enums/ssh-connections-setup-method.enum';

export interface SshConnectionSetup {
  setup_type: SshConnectionsSetupMethod;
  connection_name: string;
  private_key: {
    generate_key: boolean;
    name?: string;
    existing_key_id?: number;
  };
  manual_setup?: any;
  semi_automatic_setup?: {
    url: string;
    password: string;
    username: string;
    connect_timeout: number;
    cipher: CipherType;
    token?: string;
  };
}

export interface RemoteSshScanParams {
  connect_timeout?: number;
  host: string;
  port: number;
}
