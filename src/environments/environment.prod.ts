import { enableProdMode } from '@angular/core';
import { sentryPublicDsn } from 'environments/sentry-public-dns.const';
import { WebUiEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: WebUiEnvironment = {
  environmentVersion,
  remote,
  buildYear: 2025,
  production: true,
  sentryPublicDsn,
  debugPanel: {
    enabled: false,
    defaultMessageLimit: 100,
    mockJobDefaultDelay: 1000,
    persistMockConfigs: true,
  },
  debugPanel: {
    enabled: false,
    defaultMessageLimit: 100,
    mockJobDefaultDelay: 1000,
    persistMockConfigs: true,
  },
};

// Production
enableProdMode();
