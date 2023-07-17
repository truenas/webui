import { enableProdMode } from '@angular/core';
import { WebUiEnvironment } from './environment.interface';
import { environmentVersion } from './environment.version';

// Sentry Error handling for production mode
export const environment: WebUiEnvironment = {
  environmentVersion,
  remote: document.location.host,
  production: true,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
};

// Production
enableProdMode();
