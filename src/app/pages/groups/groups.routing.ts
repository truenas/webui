import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {GroupDeleteComponent} from './group-delete/index';
import {GroupFormComponent} from './group-form/';
import {GroupListComponent} from './group-list/';

export const routes: Routes = [
  {path : '', component : GroupListComponent, pathMatch : 'full'},
  {path : 'add', component : GroupFormComponent},
  {path : 'edit/:pk', component : GroupFormComponent},
  {path : 'delete/:pk', component : GroupDeleteComponent}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
