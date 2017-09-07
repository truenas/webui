import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';

export const routes: Routes = [{
  path: '',
  data: { title: 'Account' },
  children: [{
    path: 'users',
    data: { title: 'Users', breadcrumb: 'Users' },
    children: [{
        path: '',
        component: UserListComponent,
        data: { title: 'Users', breadcrumb: 'Users' },
      }, {
        path: 'add',
        component: UserFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: UserFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }
    ]
  }, {
    path: 'groups',
    data: { title: 'Groups', breadcrumb: 'Groups' },
    children: [{
        path: '',
        component: GroupListComponent,
        data: { title: 'Groups', breadcrumb: 'Groups' },
      }, {
        path: 'add',
        component: GroupFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'edit/:pk',
        component: GroupFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }
    ]
  }]
}]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
