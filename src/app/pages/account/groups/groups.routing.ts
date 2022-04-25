import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';

export const routes: Routes = [
  {
    path: 'groups',
    data: { title: 'Groups', breadcrumb: 'Groups' },
    children: [
      {
        path: '',
        component: GroupListComponent,
        data: { title: 'Groups', breadcrumb: 'Groups' },
      },
      {
        path: ':pk/members',
        component: GroupMembersComponent,
        data: { title: 'Update Members', breadcrumb: 'Members' },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
