import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NFSListComponent } from './nfs-list/';
import { NFSFormComponent } from './nfs-form/';

export const routes: Routes = [
  {path : '', component : NFSListComponent},
  {path : 'add', component : NFSFormComponent},
  {path : 'edit/:pk', component : NFSFormComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);