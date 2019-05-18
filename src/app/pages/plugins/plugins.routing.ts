import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PluginsAvailabelListComponent } from './plugins-available/plugins-available-list.component';
import { PluginAddComponent } from './plugin-add/plugin-add.component';
import { PluginsInstalledListComponent } from './plugins-installed/plugins-installed.component';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';
import { PluginAdvancedAddComponent } from './plugin-advanced-add/plugin-advanced-add.component';
import { PluginsComponent } from './plugins.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Plugins', breadcrumb: 'Plugins' },
    children: [
    {
      path: '',
      component: EntityDashboardComponent,
    }, {
      path: 'list',
      component: PluginsComponent,
      data: { title: 'Plugins', breadcrumb: 'Plugins', icon: 'developer_board'}
    }, {
      path: 'available',
      component: PluginsAvailabelListComponent,
      data: { title: 'Available', breadcrumb: 'Available', icon: 'developer_board'}
    },
    {
      path: 'add/:name',
      component: PluginAddComponent,
      data: { title: 'Add', breadcrumb: 'Add' },
    },
    {
      path: 'advanced/:pk',
      component: PluginAdvancedAddComponent,
      data: { title: 'Advanced Add', breadcrumb: 'Advanced Add' },
    },
    {
      path: 'installed',
      component: PluginsInstalledListComponent,
      data: { title: 'Installed', breadcrumb: 'Installed', icon: 'developer_board' },
    }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
