import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BootEnvironmentListComponent } from './bootenv-list/';
import { BootEnvironmentDeleteComponent } from './bootenv-delete/';
import { BootEnvironmentCloneComponent } from './bootenv-clone/';

export const routes: Routes = [
  { path: 'delete/:pk', component: BootEnvironmentDeleteComponent },
  { path: 'clone/:pk', component: BootEnvironmentCloneComponent },
  { path: '', component: BootEnvironmentListComponent, pathMatch: 'full' }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
