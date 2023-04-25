import { enableProdMode } from '@angular/core';
import { MockEnclosureConfig } from 'app/core/testing/interfaces/mock-enclosure-utils.interface';
import { WebUiEnvironment } from './environment.interface';

// Sentry Error handling for production mode
export const environment: WebUiEnvironment = {
  remote: document.location.host,
  production: true,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
  mockConfig: {} as MockEnclosureConfig,
};

// Production
enableProdMode();
