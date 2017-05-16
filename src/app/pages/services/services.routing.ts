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
  { // :pk to ssh breaks the functionality 
    path: 'ssh',
    component: ServiceSSHComponent,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
