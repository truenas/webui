import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './configuration/';

export const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'interfaces', loadChildren: 'app/pages/network/interfaces/interfaces.module#InterfacesModule' },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
