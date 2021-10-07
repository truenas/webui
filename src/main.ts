import { enableProdMode } from '@angular/core';
import '../node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';
import { environment } from 'environments/environment';
import { AppModule } from './app/app.module';

Sentry.init({
  dsn: 'https://4ebb52c1f3d644e1977ad20516696bc2@o1029769.ingest.sentry.io/5996774',
  integrations: [
    new Integrations.BrowserTracing({
      tracingOrigins: ['localhost', 'https://yourserver.io/api'],
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
