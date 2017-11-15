import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PluginsAvailabelListComponent } from './plugins-available/plugins-available-list/plugins-available-list.component';
import { PluginAddComponent } from './plugin-add/plugin-add.component';
import { PluginsInstalledListComponent } from './plugins-installed/plugins-installed.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Plugins' },
    children: [{
      path: 'available',
      component: PluginsAvailabelListComponent,
      data: { title: 'Available', breadcrumb: 'Available'}
    },
    {
      path: 'add/:name',
      component: PluginAddComponent,
      data: { title: 'Add', breadcrumb: 'Add' },
    },
    {
      path: 'installed',
      component: PluginsInstalledListComponent,
      data: { title: 'Installed', breadcrumb: 'Installed' },
    }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
