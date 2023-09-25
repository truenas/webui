import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';

export const routes: Routes = [
  {
    path: 'create',
    data: { title: 'Pool Creation Wizard' },
    children: [
      {
        path: '',
        component: PoolManagerComponent,
        data: {
          title: 'Pool Creation Wizard',
          breadcrumb: 'Pool Creation Wizard',
          isNew: true,
        },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
