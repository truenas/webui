import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AFPFormComponent} from './afp-form/';
import {AFPDeleteComponent} from './afp-delete/index';
import {AFPListComponent} from './afp-list/';

export const routes: Routes = [
  {path : '', component : AFPListComponent},
  {path : 'add', component : AFPFormComponent},
  {path : 'edit/:pk', component : AFPFormComponent},
  {path : 'delete/:pk', component : AFPDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
