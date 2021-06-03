export interface TwoFactorConfig {
  enabled: boolean;
  id: number;
  interval: number;
  otp_digits: number;
  secret: string;
  services: {
    ssh: boolean;
  };
  window: number;
}
