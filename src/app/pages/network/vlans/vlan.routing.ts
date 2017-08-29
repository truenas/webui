import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {VlanDeleteComponent} from './vlan-delete/';
import {VlanFormComponent} from './vlan-form/';
import {VlanListComponent} from './vlan-list/';

export const routes: Routes = [
  {path : '', component : VlanListComponent},
  {path : 'add', component : VlanFormComponent},
  {path : 'edit/:pk', component : VlanFormComponent},
  {path : 'delete/:pk', component : VlanDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
