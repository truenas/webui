import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { GroupListComponent } from './groups/group-list/';
import { GroupFormComponent } from './groups/group-form/';
import { MembersComponent } from './groups/members/members.component';
import { UserListComponent } from './users/user-list/';
import { UserFormComponent } from './users/user-form/';
import { ChangePasswordComponent } from "./users/change-password/change-password.component";

export const routes: Routes = [{
  path: '',
  data: { title: 'Accounts' },
  children: [
  {
    path: 'users',
    data: { title: 'Users', breadcrumb: 'Users', icon: 'group' },
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
      },{
        path: 'change-password',
        component: ChangePasswordComponent,
        data: { title: 'Change Password', breadcrumb: 'Change Password' },
      }
    ]
  }, {
    path: 'groups',
    data: { title: 'Groups', breadcrumb: 'Groups', icon: 'group_work' },
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
      }, {
        path: 'members/:pk',
        component: MembersComponent,
        data: {title: 'Update Members', breadcrumb: 'Members'}
      }
    ]
  }]
}];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
