import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PluginListComponent } from './installed/plugin-list/';
import { PluginDeleteComponent } from './installed/plugin-delete/';
import { PluginConfigurationComponent } from './configuration';

export const routes: Routes = [
	{ path: 'installed', component: PluginListComponent, pathMatch: 'full' },
	{ path: 'installed/delete/:pk', component: PluginDeleteComponent},
	{ path: 'configuration', component: PluginConfigurationComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
