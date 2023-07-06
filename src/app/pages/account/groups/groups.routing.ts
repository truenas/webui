import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';

export const routes: Routes = [
  {
    path: 'groups',
    data: { title: T('Groups'), breadcrumb: T('Groups') },
    children: [
      {
        path: '',
        component: GroupListComponent,
        data: { title: T('Groups'), breadcrumb: T('Groups') },
      },
      {
        path: ':pk/members',
        component: GroupMembersComponent,
        data: { title: T('Update Members'), breadcrumb: T('Members') },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
