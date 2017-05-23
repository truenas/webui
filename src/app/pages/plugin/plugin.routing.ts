import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PluginListComponent } from './installed/plugin-list/';

export const routes: Routes = [
  	{ path: 'installed', component: PluginListComponent, pathMatch: 'full' },  
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
