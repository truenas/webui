import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AFPAddComponent} from './afp-add/';
import {AFPDeleteComponent} from './afp-delete/index';
import {AFPEditComponent} from './afp-edit/index';
import {AFPListComponent} from './afp-list/';

export const routes: Routes = [
  {path : '', component : AFPListComponent},
  {path : 'add', component : AFPAddComponent},
  {path : 'edit/:pk', component : AFPEditComponent},
  {path : 'delete/:pk', component : AFPDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
