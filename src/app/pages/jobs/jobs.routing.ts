import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobsListComponent } from './jobs-list/jobs-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Jobs' },
    children: [
      {
        path: '',
        component: JobsListComponent,
        data: { title: 'Job Log', breadcrumb: 'Job Log' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
