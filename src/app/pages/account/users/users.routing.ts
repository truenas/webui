import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UserListComponent } from 'app/pages/account/users/user-list/user-list.component';

export const routes: Routes = [
  {
    path: 'users',
    data: { title: T('Users') },
    children: [
      {
        path: '',
        component: UserListComponent,
        data: { title: T('Users'), breadcrumb: T('Users') },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
