import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PluginAddComponent } from './plugin-add/plugin-add.component';
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
      component: PluginsComponent,
      data: { title: 'Plugins', breadcrumb: 'Plugins', icon: 'developer_board'}
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
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
