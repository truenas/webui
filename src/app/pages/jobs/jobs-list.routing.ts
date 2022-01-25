import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobsListComponent } from './jobs-list/jobs-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Tasks' },
    children: [
      {
        path: '',
        component: JobsListComponent,
        data: { title: 'Tasks', breadcrumb: 'Tasks' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
