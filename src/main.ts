import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';
import '../node_modules/@angular/material/prebuilt-themes/indigo-pink.css';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from 'environments/environment';


if (environment.production) {
    enableProdMode();
  }

  
  // Please build stupid jenkins
platformBrowserDynamic().bootstrapModule(AppModule);
