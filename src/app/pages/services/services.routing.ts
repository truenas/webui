import { Routes, RouterModule }  from '@angular/router';

import { Services } from './services.component';
import { ModuleWithProviders } from '@angular/core';

import { ServiceSSHComponent } from './components/service-ssh/';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '', pathMatch: 'full',
    component: Services,
  },
  { // Routes to SSH Service component
    path: 'ssh',
    component: ServiceSSHComponent,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
