import { enableProdMode } from '@angular/core';
import '../node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from 'environments/environment';
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
