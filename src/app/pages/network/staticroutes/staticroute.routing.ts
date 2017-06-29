import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StaticRouteListComponent } from './staticroute-list/';
import { StaticRouteFormComponent } from './staticroute-form/';
import { StaticRouteDeleteComponent } from './staticroute-delete/';


export const routes: Routes = [
  { path: '', component: StaticRouteListComponent },
  { path: 'add', component: StaticRouteFormComponent },
  { path: 'edit/:pk', component: StaticRouteFormComponent },
  { path: 'delete/:pk', component: StaticRouteDeleteComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
