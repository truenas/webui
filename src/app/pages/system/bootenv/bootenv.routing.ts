import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {BootEnvironmentCloneComponent} from './bootenv-clone/';
import {BootEnvironmentDeleteComponent} from './bootenv-delete/';
import {BootEnvironmentListComponent} from './bootenv-list/';

export const routes: Routes = [
  {path : 'delete/:pk', component : BootEnvironmentDeleteComponent},
  {path : 'clone/:pk', component : BootEnvironmentCloneComponent},
  {path : '', component : BootEnvironmentListComponent, pathMatch : 'full'}
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
