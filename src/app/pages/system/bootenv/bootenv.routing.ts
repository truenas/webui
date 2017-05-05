import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BootEnvironmentListComponent } from './bootenv-list/';
import { BootEnvironmentDeleteComponent } from './bootenv-delete/';
import { BootEnvironmentAddComponent } from './bootenv-add/';

export const routes: Routes = [
  { path: 'delete/:pk', component: BootEnvironmentDeleteComponent },
  { path: 'id/:pk/add', component: BootEnvironmentAddComponent },
  { path: '', component: BootEnvironmentListComponent, pathMatch: 'full' }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
