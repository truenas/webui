import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {TunableDeleteComponent} from './tunable-delete/';
import {TunableFormComponent} from './tunable-form/';
import {TunableListComponent} from './tunable-list/';

export const routes: Routes = [
  {path : 'add', component : TunableFormComponent},
  {path : 'edit/:pk', component : TunableFormComponent},
  {path : 'delete/:pk', component : TunableDeleteComponent},
  {path : '', component : TunableListComponent, pathMatch : 'full'},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);