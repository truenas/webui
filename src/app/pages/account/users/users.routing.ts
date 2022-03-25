import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from 'app/pages/account/users/user-list/user-list.component';

export const routes: Routes = [
  {
    path: 'users',
    data: { title: 'Users' },
    children: [
      {
        path: '',
        component: UserListComponent,
        data: { title: 'Users', breadcrumb: 'Users' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
