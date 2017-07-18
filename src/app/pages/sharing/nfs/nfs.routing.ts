import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {NFSFormComponent} from './nfs-form/';
import {NFSDeleteComponent} from './nfs-delete/index';
import {NFSListComponent} from './nfs-list/';

export const routes: Routes = [
  {path : '', component : NFSListComponent},
  {path : 'add', component : NFSFormComponent},
  {path : 'edit/:pk', component : NFSFormComponent},
  {path : 'delete/:pk', component : NFSDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
