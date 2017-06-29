import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {UserDeleteComponent} from './user-delete/index';
import {UserFormComponent} from './user-form/';
import {UserListComponent} from './user-list/';

export const routes: Routes = [
  {path : 'add', component : UserFormComponent},
  {path : 'edit/:pk', component : UserFormComponent},
  {path : 'delete/:pk', component : UserDeleteComponent},
  {path : '', component : UserListComponent, pathMatch : 'full'},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
