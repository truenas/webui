import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {PluginConfigurationComponent} from './configuration';
import {PluginDeleteComponent} from './installed/plugin-delete/';
import {PluginListComponent} from './installed/plugin-list/';

export const routes: Routes = [
  {path : 'installed', component : PluginListComponent, pathMatch : 'full'},
  {path : 'installed/delete/:pk', component : PluginDeleteComponent},
  {path : 'configuration', component : PluginConfigurationComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
