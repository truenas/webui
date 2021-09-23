// Angular 2
// rc2 workaround
import { enableProdMode } from '@angular/core';

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
const _decorateModuleRef = function identity<T>(value: T): T { return value; };

// Sentry Error handling for production mode

export const environment = {
  remote: document.location.host,
  port: '',
  production: true,
};

// Production
// https://github.com/qdouble/angular-webpack2-starter/issues/263
// disableDebugTools();
enableProdMode();

export const decorateModuleRef = _decorateModuleRef;
