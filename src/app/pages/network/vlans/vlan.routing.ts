import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VlanListComponent } from './vlan-list/';
import { VlanFormComponent } from './vlan-form/';
import { VlanDeleteComponent } from './vlan-delete/';


export const routes: Routes = [
  { path: '', component: VlanListComponent },
  { path: 'add', component: VlanFormComponent },
  { path: 'edit/:pk', component: VlanFormComponent },
  { path: 'delete/:pk', component: VlanDeleteComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
