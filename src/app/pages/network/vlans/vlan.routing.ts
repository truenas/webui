import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VlanListComponent } from './vlan-list/';
import { VlanAddComponent } from './vlan-add/';
import { VlanEditComponent } from './vlan-edit/';
import { VlanDeleteComponent } from './vlan-delete/';


export const routes: Routes = [
  { path: '', component: VlanListComponent },
  { path: 'add', component: VlanAddComponent },
  { path: 'edit/:pk', component: VlanEditComponent },
  { path: 'delete/:pk', component: VlanDeleteComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
