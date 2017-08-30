import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {TunableFormComponent} from './tunable-form/';
import {TunableListComponent} from './tunable-list/';

export const routes: Routes = [
  {path : 'add', component : TunableFormComponent},
  {path : 'edit/:pk', component : TunableFormComponent},
  {path : '', component : TunableListComponent, pathMatch : 'full'},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);