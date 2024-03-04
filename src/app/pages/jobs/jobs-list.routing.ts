import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { JobsListComponent } from './jobs-list/jobs-list.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: T('Jobs') },
    children: [
      {
        path: '',
        component: JobsListComponent,
        data: { title: T('Jobs'), breadcrumb: T('Jobs') },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
