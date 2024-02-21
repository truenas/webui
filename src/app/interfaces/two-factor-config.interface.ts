export interface GlobalTwoFactorConfig {
  enabled: boolean;
  id: number;
  services: {
    ssh: boolean;
  };
  window: number;
}

export interface GlobalTwoFactorConfigUpdate {
  enabled: boolean;
  services?: {
    ssh: boolean;
  };
  window?: number;
}

export interface UserTwoFactorConfig {
  provisioning_uri: string;
  secret_configured: boolean;
  interval: number;
  otp_digits: number;
}
