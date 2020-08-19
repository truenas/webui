import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CredentialsComponent } from './credentials.component';

export const routes: Routes = [{
  path: '',
  component: CredentialsComponent,
  data: { title: 'Credentials' },
  children: [
  ]
}];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);