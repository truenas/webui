export interface OpenvpnClientConfig {
  additional_parameters: string;
  authentication_algorithm: string;
  cipher: string;
  client_certificate: number;
  compression: string;
  device_type: string;
  id: number;
  interface: string;
  nobind: boolean;
  port: number;
  protocol: string;
  remote: string;
  root_ca: number;
  tls_crypt_auth: string;
  tls_crypt_auth_enabled: boolean;
}

export type OpenvpnClientUpdate = Omit<OpenvpnClientConfig, 'id' | 'interface'>;
