import { enableProdMode } from '@angular/core';

// Sentry Error handling for production mode
export const environment = {
  remote: document.location.host,
  port: '',
  production: true,
};

// Production
enableProdMode();
