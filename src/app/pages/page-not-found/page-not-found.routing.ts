import { Routes, RouterModule }  from '@angular/router';

import { PageNotFoundComponent } from './page-not-found.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: PageNotFoundComponent
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
