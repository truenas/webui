import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';

export const routes: Routes = [
  {
    path: 'create',
    data: { title: T('Pool Creation Wizard') },
    children: [
      {
        path: '',
        component: PoolManagerComponent,
        data: {
          title: T('Pool Creation Wizard'),
          breadcrumb: null,
        },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
