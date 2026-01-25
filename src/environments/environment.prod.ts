import { enableProdMode } from '@angular/core';
import { WebUiEnvironment, environmentVersion, remote } from './environment.interface';

export const environment: WebUiEnvironment = {
  environmentVersion,
  remote,
  buildYear: 2026,
  production: true,
  debugPanel: {
    enabled: false,
    defaultMessageLimit: 100,
    mockJobDefaultDelay: 1000,
    persistMockConfigs: true,
  },
};

// Production
enableProdMode();
