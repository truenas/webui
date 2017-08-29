import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ConfigurationComponent} from './configuration/';

export const routes: Routes = [
  {path : 'configuration', component : ConfigurationComponent}, {
    path : 'interfaces',
    loadChildren :
        './interfaces/interfaces.module#InterfacesModule',
    data: {title: 'Interfaces', breadcrumb:'INTERFACES' }
  },
  {
    path : 'vlans',
    loadChildren : './vlans/vlan.module#VlanModule',
    data: {title:'Vlans', breadcrumb: 'VLANS' }
  },
  {
    path : 'laggs',
    loadChildren : './laggs/lagg.module#LaggModule',
    data: {title:'Laggs', breadcrumb:'LAGS' }
  },
  {
    path : 'staticroutes',
    loadChildren :
        './staticroutes/staticroute.module#StaticRouteModule',
    data: {title: 'Static Routes', breadcrumb:'STATICROUTES'}
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
