import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GroupListComponent } from 'app/pages/account/groups/group-list/group-list.component';
import { GroupMembersComponent } from 'app/pages/account/groups/group-members/group-members.component';
import { PrivilegeListComponent } from 'app/pages/account/groups/privilege/privilege-list/privilege-list.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'groups',
  },
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
      {
        path: 'privileges',
        component: PrivilegeListComponent,
        data: { title: T('Privileges'), breadcrumb: T('Privileges') },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
