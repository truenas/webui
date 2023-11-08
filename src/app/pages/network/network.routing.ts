import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { NetworkComponent } from './network.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Network') },
    children: [
      {
        path: '',
        component: NetworkComponent,
        data: { title: T('Network'), breadcrumb: null, icon: 'settings' },
      },
    ],
  },
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
