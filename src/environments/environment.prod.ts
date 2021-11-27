import { enableProdMode } from '@angular/core';

// Sentry Error handling for production mode
export const environment = {
  remote: document.location.host,
  port: '',
  production: true,
  sentryPublicDsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
};

// Production
enableProdMode();
