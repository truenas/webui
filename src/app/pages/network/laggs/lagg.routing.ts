import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {LaggDeleteComponent} from './lagg-delete/';
import {LaggFormComponent} from './lagg-form/';
import {LaggListComponent} from './lagg-list/';

export const routes: Routes = [
  {path : '', component : LaggListComponent},
  {path : 'add', component : LaggFormComponent},
  {path : 'delete/:pk', component : LaggDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
