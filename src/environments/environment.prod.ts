// Angular 2
// rc2 workaround
import {ApplicationRef, enableProdMode, ErrorHandler} from '@angular/core';
import {disableDebugTools, enableDebugTools} from '@angular/platform-browser';

// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = function identity<T>(value: T): T { return value; };

// Sentry Error handling for production mode

export const environment = {
  remote : document.location.host,
  port : '',
  production : true
};

// Production
// https://github.com/qdouble/angular-webpack2-starter/issues/263
// disableDebugTools();
enableProdMode();

PROVIDERS = [
  // custom providers in production
];

export const decorateModuleRef = _decorateModuleRef;

export const ENV_PROVIDERS = [...PROVIDERS ];
