import { OpenVpnDeviceType } from 'app/enums/open-vpn-device-type.enum';

export interface OpenvpnServerConfig {
  additional_parameters: string;
  authentication_algorithm: string;
  cipher: string;
  compression: string;
  device_type: OpenVpnDeviceType;
  id: number;
  interface: string;
  netmask: number;
  port: number;
  protocol: string;
  root_ca: number;
  server: string;
  server_certificate: number;
  tls_crypt_auth: string;
  tls_crypt_auth_enabled: boolean;
  topology: string;
}

export type OpenvpnServerConfigUpdate = Omit<OpenvpnServerConfig, 'id' | 'interface'>;
