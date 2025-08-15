export interface WebUiEnvironment {
  environmentVersion: string;
  remote: string;
  buildYear: number;
  port?: number;
  production: boolean;
  sentryPublicDsn: string;
  debugPanel?: {
    enabled: boolean;
    defaultMessageLimit: number;
    mockJobDefaultDelay: number;
    persistMockConfigs: boolean;
  };
}

export const environmentVersion = '0.0.3';

export const remote = document.location.host;
