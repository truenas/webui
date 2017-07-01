import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {StaticRouteDeleteComponent} from './staticroute-delete/';
import {StaticRouteFormComponent} from './staticroute-form/';
import {StaticRouteListComponent} from './staticroute-list/';

export const routes: Routes = [
  {path : '', component : StaticRouteListComponent},
  {path : 'add', component : StaticRouteFormComponent},
  {path : 'edit/:pk', component : StaticRouteFormComponent},
  {path : 'delete/:pk', component : StaticRouteDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
