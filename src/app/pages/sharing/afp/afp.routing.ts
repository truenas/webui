import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AFPFormComponent } from './afp-form/';
import { AFPListComponent } from './afp-list/';

export const routes: Routes = [
  {path : '', component : AFPListComponent},
  {path : 'add', component : AFPFormComponent},
  {path : 'edit/:pk', component : AFPFormComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
