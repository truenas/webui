import { CipherType } from 'app/enums/cipher-type.enum';

export interface SshCredentials {
  id?: string;
  host: string;
  port: number;
  username: string;
  private_key: number;
  remote_host_key: string;
  cipher: CipherType;
  connect_timeout: number;
}
