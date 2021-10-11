import { enableProdMode } from '@angular/core';
import '../node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import { AppModule } from './app/app.module';

Sentry.init({
  dsn: 'https://7ac3e76fe2a94f77a58e1c38ea6b42d9@sentry.ixsystems.com/4',
});

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
