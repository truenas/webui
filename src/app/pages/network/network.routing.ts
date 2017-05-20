import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ConfigurationComponent } from './configuration/';

export const routes: Routes = [
  { path: 'configuration', component: ConfigurationComponent },
  { path: 'interfaces', loadChildren: 'app/pages/network/interfaces/interfaces.module#InterfacesModule' },
  { path: 'vlans', loadChildren: 'app/pages/network/vlans/vlan.module#VlanModule'}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
