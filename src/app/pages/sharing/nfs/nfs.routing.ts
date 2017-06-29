import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {NFSAddComponent} from './nfs-add/';
import {NFSDeleteComponent} from './nfs-delete/index';
import {NFSEditComponent} from './nfs-edit/index';
import {NFSListComponent} from './nfs-list/';

export const routes: Routes = [
  {path : '', component : NFSListComponent},
  {path : 'add', component : NFSAddComponent},
  {path : 'edit/:pk', component : NFSEditComponent},
  {path : 'delete/:pk', component : NFSDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
