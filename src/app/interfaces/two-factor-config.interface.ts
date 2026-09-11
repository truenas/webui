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
  /** Null until a secret exists for the account. */
  provisioning_uri: string | null;
  secret_configured: boolean;
  interval: number;
  otp_digits: number;
}
