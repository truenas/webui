import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { JailListComponent } from './jail-list/';
import { JailAddComponent } from './jail-add/';
import { JailEditComponent } from './jail-edit/';

export const routes: Routes = [
  { path: '', component: JailListComponent, pathMatch: 'full' },  
  { path: 'add', component: JailAddComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
