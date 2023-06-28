export interface TwoFactorConfig {
  enabled: boolean;
  id: number;
  interval: number;
  otp_digits: number;
  services: {
    ssh: boolean;
  };
  window: number;
}

export interface TwoFactorConfigUpdate {
  enabled: boolean;
  interval?: number;
  otp_digits?: number;
  services?: {
    ssh: boolean;
  };
  window?: number;
}
